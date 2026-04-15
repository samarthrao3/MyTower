import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import BillBreakdown from '../components/BillBreakdown';

const MONTH_NAMES = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
];

export default function FlatDashboard() {
    const { auth } = useAuth();
    const navigate = useNavigate();
    const [flat, setFlat] = useState(null);
    const [bills, setBills] = useState([]);
    const [selectedBill, setSelectedBill] = useState(null);
    const [pageLoading, setPageLoading] = useState(true);

    useEffect(() => {
        if (!auth || auth.role !== 'flat') {
            navigate('/');
            return;
        }
        loadData();
    }, [auth, navigate]);

    const loadData = async () => {
        setPageLoading(true);
        try {
            // Get flat info
            const { data: flatsData } = await supabase.rpc('get_flats_public');
            const myFlat = flatsData?.find(f => f.flat_id === auth.flatId);
            if (myFlat) setFlat(myFlat);

            // Get flat bills with monthly bill info
            const { data: flatBillsData } = await supabase
                .from('flat_bills')
                .select('*, monthly_bills(*)')
                .eq('flat_id', auth.flatId)
                .order('monthly_bills(year)', { ascending: false });

            if (flatBillsData) {
                // Sort by year desc, then month desc
                const sorted = flatBillsData.sort((a, b) => {
                    if (b.monthly_bills.year !== a.monthly_bills.year) {
                        return b.monthly_bills.year - a.monthly_bills.year;
                    }
                    return b.monthly_bills.month - a.monthly_bills.month;
                });
                setBills(sorted);
            }
        } catch (err) {
            console.error('Error loading data:', err);
        } finally {
            setPageLoading(false);
        }
    };

    if (pageLoading) {
        return (
            <div className="page-wrapper">
                <Navbar />
                <div className="container">
                    <div className="loading-spinner">Loading...</div>
                </div>
            </div>
        );
    }

    return (
        <div className="page-wrapper">
            <Navbar />
            <div className="container">
                {flat && (
                    <div className="flat-info-card">
                        <div className="flat-info-header">
                            <h1>{flat.name}</h1>
                            <span className="flat-size-badge">{flat.size_sqft} sq ft</span>
                        </div>
                        <div className="flat-info-details">
                            <div className="flat-info-item">
                                <span className="info-label">Owner</span>
                                <span className="info-value">{flat.owner_name}</span>
                            </div>
                            {flat.tenant_name && (
                                <div className="flat-info-item">
                                    <span className="info-label">Tenant</span>
                                    <span className="info-value">{flat.tenant_name}</span>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {selectedBill ? (
                    <div className="bill-detail-view">
                        <button className="btn btn-back" onClick={() => setSelectedBill(null)}>
                            ← Back to Bills
                        </button>
                        <BillBreakdown
                            bill={selectedBill.monthly_bills}
                            flatBill={selectedBill}
                            flat={flat}
                        />
                    </div>
                ) : (
                    <div className="bills-section">
                        <h2>📋 Maintenance Bills</h2>
                        {bills.length === 0 ? (
                            <div className="empty-state">
                                <span className="empty-icon">📭</span>
                                <p>No bills have been generated yet. Please check back later.</p>
                            </div>
                        ) : (
                            <div className="bills-grid">
                                {bills.map(billItem => (
                                    <div
                                        key={billItem.id}
                                        className="bill-card"
                                        onClick={() => setSelectedBill(billItem)}
                                    >
                                        <div className="bill-card-header">
                                            <span className="bill-card-period">
                                                {MONTH_NAMES[billItem.monthly_bills.month - 1]} {billItem.monthly_bills.year}
                                            </span>
                                        </div>
                                        <div className="bill-card-amount">
                                            ₹{Number(billItem.total_amount).toLocaleString('en-IN')}
                                        </div>
                                        <div className="bill-card-footer">
                                            <span className="bill-card-label">Total Maintenance</span>
                                            <span className="bill-card-arrow">→</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
