const MONTH_NAMES = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
];

export default function BillCard({ bill, onClick, showFlat = false }) {
    const monthName = MONTH_NAMES[bill.month - 1];

    return (
        <div className="bill-card" onClick={onClick}>
            <div className="bill-card-header">
                <span className="bill-card-period">{monthName} {bill.year}</span>
                {showFlat && <span className="bill-card-flat">{bill.flat_name || bill.flat_id}</span>}
            </div>
            <div className="bill-card-amount">
                ₹{Number(bill.total_amount).toLocaleString('en-IN')}
            </div>
            <div className="bill-card-footer">
                <span className="bill-card-label">Total Maintenance</span>
                <span className="bill-card-arrow">→</span>
            </div>
        </div>
    );
}
