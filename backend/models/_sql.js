/* =====================================================================
   Tiny SQL-Server-backed model engine that mimics the slice of the Mongoose
   API our controllers use, so switching the datastore needs no controller
   changes. Each model file calls defineModel({...}); the returned object
   exposes find / findOne / findById / create / insertMany / countDocuments /
   findByIdAndUpdate / findOneAndUpdate / findByIdAndDelete / deleteMany /
   deleteOne. Returned rows are "documents" with _id, .save() and .deleteOne().

   Mapping rules:
   - Mongo _id  <->  SQL integer identity `id` (exposed to callers as _id).
   - ObjectId refs (employee, user, manager, approvedBy) <-> <name>Id columns.
   - Nested objects (address, administration, …) <-> prefixed columns.
   - Array sub-docs (travel lines/attachments) <-> child tables.
   ===================================================================== */
const { sql, getPool } = require('../config/mssql');

const num = (v) => {
    if (v === null || v === undefined || v === '') return null;
    const n = Number(v);
    return Number.isNaN(n) ? null : n;
};

function defineModel(cfg) {
    // cfg = { table, refs:{field:{col,ref}}, nested:{group:{prefix,keys[]}}, children:{field:{table,fk,orderCol,map}} }
    cfg.refs = cfg.refs || {};
    cfg.nested = cfg.nested || {};
    cfg.children = cfg.children || {};

    // reverse lookups
    const refByCol = new Map();        // column -> mongoose field
    for (const f of Object.keys(cfg.refs)) refByCol.set(cfg.refs[f].col.toLowerCase(), f);
    const nestedByCol = new Map();     // column -> { group, key }
    for (const g of Object.keys(cfg.nested)) {
        const { prefix, keys } = cfg.nested[g];
        for (const k of keys) nestedByCol.set((prefix + k).toLowerCase(), { group: g, key: k });
    }

    let colsCache = null;
    async function cols() {
        if (colsCache) return colsCache;
        const pool = await getPool();
        const r = await pool.request().input('t', `dbo.${cfg.table}`).query(
            `SELECT c.name, ty.name AS type FROM sys.columns c
             JOIN sys.types ty ON ty.user_type_id = c.user_type_id
             WHERE c.object_id = OBJECT_ID(@t)`);
        const list = r.recordset;
        colsCache = {
            list,
            nameByLower: new Map(list.map((c) => [c.name.toLowerCase(), c.name])),
            typeByLower: new Map(list.map((c) => [c.name.toLowerCase(), c.type.toLowerCase()]))
        };
        return colsCache;
    }

    // Map a mongoose field name to its SQL column.
    function keyToCol(key) {
        if (key === '_id') return 'id';
        if (cfg.refs[key]) return cfg.refs[key].col;
        return key;
    }

    // Build a parameterised WHERE clause from a mongo-style filter.
    function buildWhere(filter, ctx) {
        const parts = [];
        const add = (col, op, val) => {
            const name = 'w' + (ctx.i++);
            ctx.binds.push({ name, value: val });
            parts.push(`[${col}] ${op} @${name}`);
        };
        for (const key of Object.keys(filter || {})) {
            if (key === '$or') {
                const ors = filter.$or.map((sub) => {
                    const subCtx = { i: ctx.i, binds: ctx.binds };
                    const w = buildWhere(sub, subCtx);
                    ctx.i = subCtx.i;
                    return w;
                }).filter(Boolean);
                if (ors.length) parts.push('(' + ors.join(' OR ') + ')');
                continue;
            }
            const col = keyToCol(key);
            const isId = col === 'id' || refByCol.has(col.toLowerCase());
            let val = filter[key];
            if (val !== null && typeof val === 'object' && !(val instanceof Date)) {
                if ('$ne' in val) { val.$ne === null ? parts.push(`[${col}] IS NOT NULL`) : add(col, '<>', isId ? num(val.$ne) : val.$ne); }
                if ('$in' in val) {
                    const arr = (val.$in || []).map((v) => (isId ? num(v) : v));
                    if (arr.length === 0) { parts.push('1 = 0'); }
                    else {
                        const names = arr.map((v) => { const n = 'w' + (ctx.i++); ctx.binds.push({ name: n, value: v }); return '@' + n; });
                        parts.push(`[${col}] IN (${names.join(', ')})`);
                    }
                }
                if ('$nin' in val) {
                    const arr = (val.$nin || []).map((v) => (isId ? num(v) : v));
                    if (arr.length) {
                        const names = arr.map((v) => { const n = 'w' + (ctx.i++); ctx.binds.push({ name: n, value: v }); return '@' + n; });
                        parts.push(`[${col}] NOT IN (${names.join(', ')})`);
                    }
                }
                if ('$gte' in val) add(col, '>=', val.$gte);
                if ('$gt' in val) add(col, '>', val.$gt);
                if ('$lte' in val) add(col, '<=', val.$lte);
                if ('$lt' in val) add(col, '<', val.$lt);
                if ('$regex' in val) add(col, 'LIKE', `%${val.$regex}%`); // default CI collation
                if ('$exists' in val) parts.push(`[${col}] IS ${val.$exists ? 'NOT NULL' : 'NULL'}`);
            } else {
                if (val === null) parts.push(`[${col}] IS NULL`);
                else add(col, '=', isId ? num(val) : val);
            }
        }
        return parts.join(' AND ');
    }

    // Convert a mongoose-style object to a { column: value } row.
    async function toRow(doc, { isUpdate } = {}) {
        const c = await cols();
        const out = {};
        for (const { name } of c.list) {
            const low = name.toLowerCase();
            if (low === 'id') continue;
            if (low === 'mongoid') continue;
            if (low === 'createdat') { if (!isUpdate) out[name] = new Date(); continue; }
            if (low === 'updatedat') { out[name] = new Date(); continue; }
            if (refByCol.has(low)) {
                const f = refByCol.get(low);
                if (Object.prototype.hasOwnProperty.call(doc, f)) {
                    let v = doc[f];
                    if (v && typeof v === 'object') v = v._id;
                    out[name] = num(v);
                }
                continue;
            }
            if (nestedByCol.has(low)) {
                const { group, key } = nestedByCol.get(low);
                if (doc[group] && Object.prototype.hasOwnProperty.call(doc[group], key)) out[name] = doc[group][key];
                continue;
            }
            if (Object.prototype.hasOwnProperty.call(doc, name)) out[name] = doc[name];
        }
        return out;
    }

    // Convert a SQL row to a document object.
    function toDoc(row) {
        const data = {};
        for (const key of Object.keys(row)) {
            const low = key.toLowerCase();
            if (low === 'id' || low === 'mongoid') continue;
            if (refByCol.has(low)) { data[refByCol.get(low)] = row[key]; continue; }
            if (nestedByCol.has(low)) {
                const { group, k } = { group: nestedByCol.get(low).group, k: nestedByCol.get(low).key };
                data[group] = data[group] || {};
                data[group][k] = row[key];
                continue;
            }
            data[key] = row[key];
        }
        return makeDoc(data, row.id);
    }

    function makeDoc(data, id) {
        const doc = { ...data };
        Object.defineProperty(doc, '_id', { value: id, enumerable: true, writable: true });
        Object.defineProperty(doc, 'id', { value: id, enumerable: false, writable: true });
        Object.defineProperty(doc, 'save', {
            value: async function () {
                const pool = await getPool();
                const row = await toRow(this, { isUpdate: true });
                const c = await cols();
                const keys = Object.keys(row);
                const req = pool.request();
                const sets = keys.map((k, i) => {
                    const p = 's' + i;
                    const type = c.typeByLower.get(k.toLowerCase());
                    if (type === 'varbinary') req.input(p, sql.VarBinary(sql.MAX), row[k]);
                    else req.input(p, row[k]);
                    return `[${k}] = @${p}`;
                });
                req.input('idv', this._id);
                if (sets.length) await req.query(`UPDATE dbo.${cfg.table} SET ${sets.join(', ')} WHERE id = @idv`);
                await syncChildren(this);
                return this;
            }, enumerable: false
        });
        Object.defineProperty(doc, 'deleteOne', {
            value: async function () {
                const pool = await getPool();
                await pool.request().input('idv', this._id).query(`DELETE FROM dbo.${cfg.table} WHERE id = @idv`);
                return this;
            }, enumerable: false
        });
        const plain = () => { const o = { ...doc }; o._id = id; return o; };
        Object.defineProperty(doc, 'toObject', { value: plain, enumerable: false });
        Object.defineProperty(doc, 'toJSON', { value: plain, enumerable: false });
        return doc;
    }

    async function insertChildren(parentId, doc) {
        for (const field of Object.keys(cfg.children)) {
            const childCfg = cfg.children[field];
            const arr = Array.isArray(doc[field]) ? doc[field] : [];
            const pool = await getPool();
            let n = 0;
            for (const item of arr) {
                const row = childCfg.map(item, ++n);
                row[childCfg.fk] = parentId;
                const keys = Object.keys(row);
                const req = pool.request();
                keys.forEach((k, i) => req.input('c' + i, row[k]));
                await req.query(`INSERT INTO dbo.${childCfg.table} (${keys.map((k) => `[${k}]`).join(', ')}) VALUES (${keys.map((_, i) => '@c' + i).join(', ')})`);
            }
        }
    }
    async function syncChildren(doc) {
        for (const field of Object.keys(cfg.children)) {
            if (!Array.isArray(doc[field])) continue;
            const childCfg = cfg.children[field];
            const pool = await getPool();
            await pool.request().input('p', doc._id).query(`DELETE FROM dbo.${childCfg.table} WHERE ${childCfg.fk} = @p`);
            await insertChildren(doc._id, doc);
        }
    }
    async function loadChildren(docs) {
        const fields = Object.keys(cfg.children);
        if (!fields.length || !docs.length) return;
        const pool = await getPool();
        const ids = docs.map((d) => d._id);
        for (const field of fields) {
            const childCfg = cfg.children[field];
            const inList = ids.map((_, i) => '@i' + i).join(', ');
            const req = pool.request();
            ids.forEach((v, i) => req.input('i' + i, v));
            const r = await req.query(`SELECT * FROM dbo.${childCfg.table} WHERE ${childCfg.fk} IN (${inList}) ORDER BY ${childCfg.orderCol || 'id'}`);
            const byParent = new Map();
            for (const row of r.recordset) {
                const pid = row[childCfg.fk];
                if (!byParent.has(pid)) byParent.set(pid, []);
                byParent.get(pid).push(childCfg.unmap ? childCfg.unmap(row) : row);
            }
            for (const d of docs) d[field] = byParent.get(d._id) || [];
        }
    }

    async function applyPopulate(docs, populates) {
        for (const pop of populates) {
            const ref = cfg.refs[pop.path];
            if (!ref) continue;
            const ids = [...new Set(docs.map((d) => d[pop.path]).filter((v) => v != null))];
            if (!ids.length) { docs.forEach((d) => { if (d[pop.path] == null) d[pop.path] = null; }); continue; }
            const pool = await getPool();
            const fields = pop.select ? pop.select.split(/\s+/).filter(Boolean) : null;
            const colList = fields ? ['id', ...fields].map((f) => `[${f === '_id' ? 'id' : f}]`).join(', ') : '*';
            const inList = ids.map((_, i) => '@p' + i).join(', ');
            const req = pool.request();
            ids.forEach((v, i) => req.input('p' + i, v));
            const r = await req.query(`SELECT ${colList} FROM dbo.${ref.ref} WHERE id IN (${inList})`);
            const map = new Map();
            for (const row of r.recordset) {
                const o = {}; for (const k of Object.keys(row)) { if (k === 'id') o._id = row.id; else o[k] = row[k]; }
                map.set(row.id, o);
            }
            docs.forEach((d) => { d[pop.path] = map.get(d[pop.path]) || null; });
        }
    }

    function applySelect(docs, select) {
        if (!select) return;
        const tokens = select.split(/\s+/).filter(Boolean);
        const excludes = tokens.filter((t) => t.startsWith('-')).map((t) => t.slice(1));
        const includes = tokens.filter((t) => !t.startsWith('-'));
        for (const d of docs) {
            if (excludes.length) excludes.forEach((f) => { delete d[f]; });
            if (includes.length) {
                for (const k of Object.keys(d)) {
                    if (k === '_id') continue;
                    if (!includes.includes(k)) delete d[k];
                }
            }
        }
    }

    // Thenable query builder for find/findOne.
    class Query {
        constructor(kind, filter) { this.kind = kind; this.filter = filter || {}; this._sort = null; this._select = null; this._pop = []; }
        sort(s) { this._sort = s; return this; }
        select(s) { this._select = s; return this; }
        populate(path, select) {
            if (typeof path === 'object') this._pop.push({ path: path.path, select: path.select });
            else this._pop.push({ path, select });
            return this;
        }
        async exec() {
            const pool = await getPool();
            const ctx = { i: 0, binds: [] };
            const where = buildWhere(this.filter, ctx);
            let q = `SELECT * FROM dbo.${cfg.table}`;
            if (where) q += ` WHERE ${where}`;
            if (this._sort) {
                const order = Object.keys(this._sort).map((k) => `[${keyToCol(k)}] ${this._sort[k] === -1 || this._sort[k] === 'desc' ? 'DESC' : 'ASC'}`);
                if (order.length) q += ` ORDER BY ${order.join(', ')}`;
            }
            const req = pool.request();
            ctx.binds.forEach((b) => req.input(b.name, b.value));
            const r = await req.query(q);
            let docs = r.recordset.map(toDoc);
            await loadChildren(docs);
            if (this._pop.length) await applyPopulate(docs, this._pop);
            if (this._select) applySelect(docs, this._select);
            return this.kind === 'findOne' ? (docs[0] || null) : docs;
        }
        then(resolve, reject) { return this.exec().then(resolve, reject); }
        catch(reject) { return this.exec().catch(reject); }
    }

    const Model = {
        _cfg: cfg,
        modelName: cfg.name,
        // Column names (excluding internal/audit columns) — replaces Mongoose schema.paths.
        async fieldNames() {
            const c = await cols();
            return c.list.map((x) => x.name).filter((n) => !['id', 'mongoId', 'createdAt', 'updatedAt'].includes(n));
        },
        find(filter) { return new Query('find', filter); },
        findOne(filter) { return new Query('findOne', filter); },
        findById(id) { return new Query('findOne', { _id: id }); },
        async create(obj) {
            const pool = await getPool();
            const row = await toRow(obj, { isUpdate: false });
            const c = await cols();
            const keys = Object.keys(row);
            const req = pool.request();
            keys.forEach((k, i) => {
                const type = c.typeByLower.get(k.toLowerCase());
                if (type === 'varbinary') req.input('p' + i, sql.VarBinary(sql.MAX), row[k]);
                else req.input('p' + i, row[k]);
            });
            const r = await req.query(`INSERT INTO dbo.${cfg.table} (${keys.map((k) => `[${k}]`).join(', ')}) OUTPUT INSERTED.id AS id VALUES (${keys.map((_, i) => '@p' + i).join(', ')})`);
            const id = r.recordset[0].id;
            await insertChildren(id, obj);
            const fresh = await new Query('findOne', { _id: id }).exec();
            return fresh;
        },
        async insertMany(arr) {
            const out = [];
            for (const o of (arr || [])) out.push(await this.create(o));
            return out;
        },
        async countDocuments(filter) {
            const pool = await getPool();
            const ctx = { i: 0, binds: [] };
            const where = buildWhere(filter || {}, ctx);
            const req = pool.request();
            ctx.binds.forEach((b) => req.input(b.name, b.value));
            const r = await req.query(`SELECT COUNT(*) AS n FROM dbo.${cfg.table}${where ? ' WHERE ' + where : ''}`);
            return r.recordset[0].n;
        },
        async findByIdAndUpdate(id, update, opts) { return updateOneBy({ _id: id }, update, opts); },
        async findOneAndUpdate(filter, update, opts) { return updateOneBy(filter, update, opts); },
        async findByIdAndDelete(id) {
            const doc = await new Query('findOne', { _id: id }).exec();
            if (doc) await doc.deleteOne();
            return doc;
        },
        async deleteMany(filter) {
            const pool = await getPool();
            const ctx = { i: 0, binds: [] };
            const where = buildWhere(filter || {}, ctx);
            const req = pool.request();
            ctx.binds.forEach((b) => req.input(b.name, b.value));
            const r = await req.query(`DELETE FROM dbo.${cfg.table}${where ? ' WHERE ' + where : ''}`);
            return { deletedCount: r.rowsAffected[0] || 0 };
        },
        async deleteOne(filter) {
            const doc = await new Query('findOne', filter).exec();
            if (doc) await doc.deleteOne();
            return { deletedCount: doc ? 1 : 0 };
        }
    };

    async function updateOneBy(filter, update, opts) {
        const doc = await new Query('findOne', filter).exec();
        if (!doc) return null;
        const u = update && update.$set ? update.$set : (update || {});
        Object.assign(doc, u);
        await doc.save();
        if (opts && opts.new) return new Query('findOne', { _id: doc._id }).exec();
        return doc;
    }

    return Model;
}

module.exports = { defineModel, sql };
