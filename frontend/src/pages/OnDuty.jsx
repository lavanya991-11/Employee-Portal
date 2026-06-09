import Sidebar from '../components/Sidebar';
import PageHeader from '../components/PageHeader';

function OnDuty() {
    return (
        <div className="app-layout">
            <Sidebar />
            <main className="main-content">
                <PageHeader pageName="On Duty" />
                <div className="erp-page">
                    <div className="erp-titlebar">
                        <div className="erp-title">On Duty</div>
                    </div>
                    <div className="erp-body">
                        <div className="erp-list-card" style={{ padding: 16 }}>
                            <p style={{ color: '#6b7280' }}>On Duty module — coming soon.</p>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}

export default OnDuty;
