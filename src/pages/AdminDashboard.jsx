import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import BillForm from '../components/BillForm';

const MONTH_NAMES = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
];

export default function AdminDashboard() {
    const { auth } = useAuth();
    const navigate = useNavigate();
    const [bills, setBills] = useState([]);
    const [flats, setFlats] = useState([]);
    const [flatBills, setFlatBills] = useState({});
    const [loading, setLoading] = useState(false);
    const [pageLoading, setPageLoading] = useState(true);
    const [expandedBill, setExpandedBill] = useState(null);
    const [successMsg, setSuccessMsg] = useState('');

    useEffect(() => {
        if (!auth || auth.role !== 'admin') {
            navigate('/');
            return;
        }
        loadData();
    }, [auth, navigate]);

    const loadData = async () => {
        setPageLoading(true);
        try {
            const [billsRes, flatsRes] = await Promise.all([
                supabase.from('monthly_bills').select('*').order('year', { ascending: false }).order('month', { ascending: false }),
                supabase.rpc('get_flats_public'),
            ]);

            if (billsRes.data) setBills(billsRes.data);
            if (flatsRes.data) setFlats(flatsRes.data);

            // Load flat bills for all monthly bills
            if (billsRes.data && billsRes.data.length > 0) {
                const { data: allFlatBills } = await supabase
                    .from('flat_bills')
                    .select('*')
                    .in('monthly_bill_id', billsRes.data.map(b => b.id));

                if (allFlatBills) {
                    const grouped = {};
                    allFlatBills.forEach(fb => {
                        if (!grouped[fb.monthly_bill_id]) grouped[fb.monthly_bill_id] = [];
                        grouped[fb.monthly_bill_id].push(fb);
                    });
                    setFlatBills(grouped);
                }
            }
        } catch (err) {
            console.error('Error loading data:', err);
        } finally {
            setPageLoading(false);
        }
    };

    const handleSubmitBill = async (formData) => {
        setLoading(true);
        setSuccessMsg('');
        try {
            // Insert monthly bill
            const { data: newBill, error: insertError } = await supabase
                .from('monthly_bills')
                .insert([formData])
                .select()
                .single();

            if (insertError) throw insertError;

            // Calculate and insert flat bills via RPC
            const { error: calcError } = await supabase.rpc('calculate_and_insert_bills', {
                p_bill_id: newBill.id,
            });

            if (calcError) throw calcError;

            setSuccessMsg(`✅ Bills calculated for ${MONTH_NAMES[formData.month - 1]} ${formData.year}!`);
            await loadData();
        } catch (err) {
            console.error('Error submitting bill:', err);
            alert('Error: ' + (err.message || 'Failed to save bill'));
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteBill = async (billId, month, year) => {

        try {
            // Delete flat bills first (avoid CASCADE + RLS issues)
            const { error: flatError } = await supabase
                .from('flat_bills')
                .delete()
                .eq('monthly_bill_id', billId);
            if (flatError) {
                console.error('Error deleting flat bills:', flatError);
                throw flatError;
            }

            // Then delete the monthly bill
            const { error } = await supabase
                .from('monthly_bills')
                .delete()
                .eq('id', billId);
            if (error) {
                console.error('Error deleting monthly bill:', error);
                throw error;
            }

            setSuccessMsg(`🗑️ Bill for ${MONTH_NAMES[month - 1]} ${year} deleted.`);
            await loadData();
        } catch (err) {
            console.error('Delete error:', err);
            alert('Error deleting bill: ' + (err.message || JSON.stringify(err)));
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
                <div className="page-header">
                    <h1>Admin Dashboard</h1>
                    <p>Enter monthly expenses and manage apartment bills</p>
                </div>

                {successMsg && <div className="success-message">{successMsg}</div>}

                <div className="admin-layout">
                    <div className="admin-form-section">
                        <BillForm
                            onSubmit={handleSubmitBill}
                            loading={loading}
                            existingMonths={bills.map(b => ({ month: b.month, year: b.year }))}
                        />
                    </div>

                    <div className="admin-bills-section">
                        <h3>📋 Bill History</h3>
                        {bills.length === 0 ? (
                            <div className="empty-state">
                                <span className="empty-icon">📭</span>
                                <p>No bills entered yet. Use the form to add your first bill.</p>
                            </div>
                        ) : (
                            <div className="bills-list">
                                {bills.map(bill => {
                                    const isExpanded = expandedBill === bill.id;
                                    const billFlatBills = flatBills[bill.id] || [];
                                    const totalAmount = billFlatBills.reduce((sum, fb) => sum + Number(fb.total_amount), 0);

                                    return (
                                        <div key={bill.id} className="admin-bill-item">
                                            <div
                                                className="admin-bill-header"
                                                onClick={() => setExpandedBill(isExpanded ? null : bill.id)}
                                            >
                                                <div className="admin-bill-info">
                                                    <span className="admin-bill-period">
                                                        {MONTH_NAMES[bill.month - 1]} {bill.year}
                                                    </span>
                                                    <span className="admin-bill-total">
                                                        Total: ₹{totalAmount.toLocaleString('en-IN')}
                                                    </span>
                                                </div>
                                                <div className="admin-bill-actions">
                                                    <button
                                                        className="btn btn-icon"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleDeleteBill(bill.id, bill.month, bill.year);
                                                        }}
                                                        title="Delete bill"
                                                    >
                                                        🗑️
                                                    </button>
                                                    <span className={`expand-arrow ${isExpanded ? 'expanded' : ''}`}>▼</span>
                                                </div>
                                            </div>

                                            {isExpanded && (
                                                <div className="admin-bill-details">
                                                    <div className="admin-bill-expenses">
                                                        <div className="expense-chip">💧 ₹{Number(bill.water_bill).toLocaleString('en-IN')}</div>
                                                        <div className="expense-chip">⚡ ₹{Number(bill.electricity_bill).toLocaleString('en-IN')}</div>
                                                        <div className="expense-chip">🗑️ ₹{Number(bill.garbage_tips).toLocaleString('en-IN')}</div>
                                                        <div className="expense-chip">🔒 ₹{Number(bill.security_fees).toLocaleString('en-IN')}</div>
                                                        {Number(bill.misc_expenses) > 0 && (
                                                            <div className="expense-chip">🔧 ₹{Number(bill.misc_expenses).toLocaleString('en-IN')}</div>
                                                        )}
                                                    </div>
                                                    {bill.misc_description && (
                                                        <div className="misc-note">📝 {bill.misc_description}</div>
                                                    )}
                                                    <table className="flat-bills-table">
                                                        <thead>
                                                            <tr>
                                                                <th>Flat</th>
                                                                <th>Owner</th>
                                                                <th>Proportional</th>
                                                                <th>Security</th>
                                                                <th>Total</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {billFlatBills
                                                                .sort((a, b) => a.flat_id.localeCompare(b.flat_id))
                                                                .map(fb => {
                                                                    const flat = flats.find(f => f.flat_id === fb.flat_id);
                                                                    return (
                                                                        <tr key={fb.id}>
                                                                            <td>{flat?.name || fb.flat_id}</td>
                                                                            <td>{flat?.owner_name || '—'}</td>
                                                                            <td>₹{Number(fb.proportional_amount).toLocaleString('en-IN')}</td>
                                                                            <td>₹{Number(fb.security_share).toLocaleString('en-IN')}</td>
                                                                            <td className="amount-cell">₹{Number(fb.total_amount).toLocaleString('en-IN')}</td>
                                                                        </tr>
                                                                    );
                                                                })}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
