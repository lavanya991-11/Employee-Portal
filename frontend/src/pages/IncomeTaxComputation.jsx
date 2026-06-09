import Sidebar from '../components/Sidebar';
import PageHeader from '../components/PageHeader';

function IncomeTaxComputation() {
    return (
        <div className="app-layout">
            <Sidebar />
            <main className="main-content">
                <PageHeader pageName="Income Tax Computation" />
                <div className="erp-page">
                    <div className="erp-titlebar">
                        <div className="erp-title">Income Tax Computation</div>
                    </div>
                    <div className="erp-body">
                        <div className="erp-list-card" style={{ padding: 16 }}>
                            <p style={{ color: '#6b7280' }}>Income Tax Computation module — coming soon.</p>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}

export default IncomeTaxComputation;
