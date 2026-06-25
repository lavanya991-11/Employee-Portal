import Sidebar from '../components/Sidebar';
import PageHeader from '../components/PageHeader';

const ANNOUNCEMENTS = [
    {
        id: 1,
        icon: '📢',
        iconBg: '#dbeafe',
        title: 'Welcome to the new Employee Portal',
        body: 'Use the sidebar to navigate Leave, Loan, Expenses and more. Check the Dashboard tiles for quick access to all your tools.',
        author: 'HR Department',
        date: 'today'
    },
    {
        id: 2,
        icon: '📋',
        iconBg: '#dcfce7',
        title: 'Holidays for 2026 are now live',
        body: 'See the Holidays page for the official calendar from Business Central. All public holidays for the year are available.',
        author: 'HR Department',
        date: 'today'
    },
    {
        id: 3,
        icon: '👥',
        iconBg: '#fce7f3',
        title: 'Apply Leave page now auto-splits Paid + Unpaid',
        body: 'When your request exceeds the balance, the system automatically splits the leave into Paid (within balance) and Unpaid (overflow) portions, and posts each to Business Central.',
        author: 'System',
        date: 'this week'
    },
    {
        id: 4,
        icon: '💰',
        iconBg: '#fef3c7',
        title: 'Apply Loan: only Loan Amount is editable now',
        body: 'Approved Amount, Installment Amount, and Number of Installments are now auto-calculated. Just enter the Loan Amount and the rest fills in automatically.',
        author: 'Finance Team',
        date: 'last week'
    },
    {
        id: 5,
        icon: '🎉',
        iconBg: '#ede9fe',
        title: 'BC Holidays endpoint is live',
        body: 'Public Holidays from BC NOVAPAY are now imported with the year filter. Visit the Holidays page from the Dashboard Quick Links.',
        author: 'System',
        date: '2 weeks ago'
    },
    {
        id: 6,
        icon: '✅',
        iconBg: '#dcfce7',
        title: 'Approvals route restricted to Super Admin',
        body: 'For now, only Super Admin can approve or reject leave requests. The Approvals link is visible only to authorised users in the sidebar.',
        author: 'HR Department',
        date: '3 weeks ago'
    }
];

function Announcements() {
    return (
        <div className="app-layout">
            <Sidebar />
            <main className="main-content">
                <PageHeader pageName="Announcements" />
                <div className="erp-page">
                    <div className="erp-titlebar">
                        <div className="erp-title">Announcements</div>
                    </div>

                    <div className="erp-body">
                        <div className="erp-list-card" style={{ width: '100%' }}>
                            {ANNOUNCEMENTS.length === 0 && (
                                <p style={{ padding: 16, color: '#888' }}>No announcements at this time.</p>
                            )}
                            {ANNOUNCEMENTS.map((a) => (
                                <div key={a.id} style={{ display: 'flex', gap: 14, padding: '16px 20px', borderBottom: '1px solid #f3f4f6' }}>
                                    <div style={{
                                        width: 44, height: 44, borderRadius: 10, background: a.iconBg,
                                        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                                        fontSize: 22, flexShrink: 0
                                    }}>{a.icon}</div>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ fontWeight: 600, fontSize: 15, color: '#111827', marginBottom: 4 }}>
                                            {a.title}
                                        </div>
                                        <div style={{ fontSize: 13, color: '#4b5563', lineHeight: 1.5, marginBottom: 8 }}>
                                            {a.body}
                                        </div>
                                        <div style={{ fontSize: 11, color: '#9ca3af' }}>
                                            <b>{a.author}</b> · {a.date}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}

export default Announcements;
