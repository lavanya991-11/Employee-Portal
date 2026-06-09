import Sidebar from '../components/Sidebar';
import PageHeader from '../components/PageHeader';

function IncomeTaxDeclarations() {
    return (
        <div className="app-layout">
            <Sidebar />
            <main className="main-content">
                <PageHeader pageName="Income Tax Declarations" />
                <div className="erp-page">
                    <div className="erp-titlebar">
                        <div className="erp-title">Income Tax Declarations</div>
                    </div>
                    <div className="erp-body">
                        <div className="erp-list-card" style={{ padding: 16 }}>
                            <p style={{ color: '#6b7280' }}>Income Tax Declarations module — coming soon.</p>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}

export default IncomeTaxDeclarations;
