import { useState } from 'react';

const currentDate = new Date();
const CURRENT_MONTH = currentDate.getMonth() + 1;
const CURRENT_YEAR = currentDate.getFullYear();

const MONTH_NAMES = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
];

export default function BillForm({ onSubmit, loading, existingMonths = [] }) {
    const [formData, setFormData] = useState({
        month: CURRENT_MONTH,
        year: CURRENT_YEAR,
        water_bill: '',
        electricity_bill: '',
        garbage_tips: '200',
        misc_expenses: '0',
        misc_description: '',
        security_fees: '13000',
    });

    const [error, setError] = useState('');

    const handleChange = (e) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
        setError('');
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        // Validation
        if (!formData.water_bill || !formData.electricity_bill) {
            setError('Please enter water and electricity bills');
            return;
        }

        // Check if bill already exists for this month
        const exists = existingMonths.some(
            m => m.month === Number(formData.month) && m.year === Number(formData.year)
        );
        if (exists) {
            setError(`Bill for ${MONTH_NAMES[formData.month - 1]} ${formData.year} already exists. Delete it first to re-enter.`);
            return;
        }

        onSubmit({
            month: Number(formData.month),
            year: Number(formData.year),
            water_bill: Number(formData.water_bill),
            electricity_bill: Number(formData.electricity_bill),
            garbage_tips: Number(formData.garbage_tips),
            misc_expenses: Number(formData.misc_expenses),
            misc_description: formData.misc_description,
            security_fees: Number(formData.security_fees),
        });
    };

    return (
        <form className="bill-form" onSubmit={handleSubmit}>
            <h3>📝 Enter Monthly Expenses</h3>

            {error && <div className="form-error">{error}</div>}

            <div className="form-row">
                <div className="form-group">
                    <label htmlFor="month">Month</label>
                    <select id="month" name="month" value={formData.month} onChange={handleChange}>
                        {MONTH_NAMES.map((name, i) => (
                            <option key={i} value={i + 1}>{name}</option>
                        ))}
                    </select>
                </div>
                <div className="form-group">
                    <label htmlFor="year">Year</label>
                    <input
                        id="year"
                        name="year"
                        type="number"
                        min="2020"
                        max="2030"
                        value={formData.year}
                        onChange={handleChange}
                    />
                </div>
            </div>

            <div className="form-row">
                <div className="form-group">
                    <label htmlFor="water_bill">💧 Water Bill (₹)</label>
                    <input
                        id="water_bill"
                        name="water_bill"
                        type="number"
                        min="0"
                        placeholder="e.g. 3000"
                        value={formData.water_bill}
                        onChange={handleChange}
                        required
                    />
                </div>
                <div className="form-group">
                    <label htmlFor="electricity_bill">⚡ Electricity Bill (₹)</label>
                    <input
                        id="electricity_bill"
                        name="electricity_bill"
                        type="number"
                        min="0"
                        placeholder="e.g. 5000"
                        value={formData.electricity_bill}
                        onChange={handleChange}
                        required
                    />
                </div>
            </div>

            <div className="form-row">
                <div className="form-group">
                    <label htmlFor="garbage_tips">🗑️ Garbage Tips (₹)</label>
                    <input
                        id="garbage_tips"
                        name="garbage_tips"
                        type="number"
                        min="0"
                        value={formData.garbage_tips}
                        onChange={handleChange}
                    />
                </div>
                <div className="form-group">
                    <label htmlFor="security_fees">🔒 Security Fees (₹)</label>
                    <input
                        id="security_fees"
                        name="security_fees"
                        type="number"
                        min="0"
                        value={formData.security_fees}
                        onChange={handleChange}
                    />
                </div>
            </div>

            <div className="form-group full-width">
                <label htmlFor="misc_expenses">🔧 Miscellaneous Expenses (₹)</label>
                <input
                    id="misc_expenses"
                    name="misc_expenses"
                    type="number"
                    min="0"
                    value={formData.misc_expenses}
                    onChange={handleChange}
                />
            </div>

            <div className="form-group full-width">
                <label htmlFor="misc_description">📝 Miscellaneous Details</label>
                <input
                    id="misc_description"
                    name="misc_description"
                    type="text"
                    placeholder="e.g. Lift repair, plumbing work..."
                    value={formData.misc_description}
                    onChange={handleChange}
                />
            </div>

            <button type="submit" className="btn btn-primary btn-submit" disabled={loading}>
                {loading ? 'Calculating...' : '💾 Save & Calculate Bills'}
            </button>
        </form>
    );
}
