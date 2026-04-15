const MONTH_NAMES = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
];

export default function BillBreakdown({ bill, flatBill, flat }) {
    const monthName = MONTH_NAMES[bill.month - 1];
    const totalSqft = 7630;
    const ratio = flat.size_sqft / totalSqft;
    const variableTotal = Number(bill.water_bill) + Number(bill.electricity_bill) + Number(bill.garbage_tips) + Number(bill.misc_expenses);

    return (
        <div className="bill-breakdown">
            <div className="breakdown-header">
                <h2>{monthName} {bill.year}</h2>
                <div className="breakdown-flat-info">
                    <span className="flat-badge">{flat.name}</span>
                    <span className="flat-size">{flat.size_sqft} sq ft</span>
                </div>
            </div>

            <div className="breakdown-section">
                <h3>📊 Total Apartment Expenses</h3>
                <div className="breakdown-table">
                    <div className="breakdown-row">
                        <span className="breakdown-label">💧 Water Bill</span>
                        <span className="breakdown-value">₹{Number(bill.water_bill).toLocaleString('en-IN')}</span>
                    </div>
                    <div className="breakdown-row">
                        <span className="breakdown-label">⚡ Electricity Bill</span>
                        <span className="breakdown-value">₹{Number(bill.electricity_bill).toLocaleString('en-IN')}</span>
                    </div>
                    <div className="breakdown-row">
                        <span className="breakdown-label">🗑️ Garbage Tips</span>
                        <span className="breakdown-value">₹{Number(bill.garbage_tips).toLocaleString('en-IN')}</span>
                    </div>
                    <div className="breakdown-row">
                        <span className="breakdown-label">🔧 Miscellaneous</span>
                        <span className="breakdown-value">₹{Number(bill.misc_expenses).toLocaleString('en-IN')}</span>
                    </div>
                    {bill.misc_description && (
                        <div className="breakdown-row breakdown-note">
                            <span className="breakdown-label">📝 Details</span>
                            <span className="breakdown-value">{bill.misc_description}</span>
                        </div>
                    )}
                    <div className="breakdown-row">
                        <span className="breakdown-label">🔒 Security Fees</span>
                        <span className="breakdown-value">₹{Number(bill.security_fees).toLocaleString('en-IN')}</span>
                    </div>
                    <div className="breakdown-row breakdown-total-row">
                        <span className="breakdown-label">Total Expenses</span>
                        <span className="breakdown-value">₹{(variableTotal + Number(bill.security_fees)).toLocaleString('en-IN')}</span>
                    </div>
                </div>
            </div>

            <div className="breakdown-section">
                <h3>🧮 Your Calculation</h3>
                <div className="breakdown-formula">
                    <div className="formula-line">
                        <span>Proportional Share</span>
                        <span>= ({flat.size_sqft} / {totalSqft}) × ₹{variableTotal.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="formula-line">
                        <span></span>
                        <span>= {(ratio * 100).toFixed(2)}% × ₹{variableTotal.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="formula-line formula-result">
                        <span></span>
                        <span>= ₹{Number(flatBill.proportional_amount).toLocaleString('en-IN')}</span>
                    </div>
                </div>
                <div className="breakdown-table">
                    <div className="breakdown-row">
                        <span className="breakdown-label">📐 Proportional Share</span>
                        <span className="breakdown-value">₹{Number(flatBill.proportional_amount).toLocaleString('en-IN')}</span>
                    </div>
                    <div className="breakdown-row">
                        <span className="breakdown-label">🔒 Security Share (equal)</span>
                        <span className="breakdown-value">₹{Number(flatBill.security_share).toLocaleString('en-IN')}</span>
                    </div>
                    <div className="breakdown-row breakdown-grand-total">
                        <span className="breakdown-label">💰 Your Total Bill</span>
                        <span className="breakdown-value">₹{Number(flatBill.total_amount).toLocaleString('en-IN')}</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
