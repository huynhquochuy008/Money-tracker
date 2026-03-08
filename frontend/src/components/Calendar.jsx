/**
 * Calendar.jsx — Monthly calendar view showing daily spending totals.
 */
import React from 'react';

export default function Calendar({ expenses, month }) {
    // Parse the selected month (YYYY-MM)
    const [year, mm] = month.split('-').map(Number);
    const monthIndex = mm - 1;

    // Get number of days in the month
    const daysInMonth = new Date(year, mm, 0).getDate();
    // Get the first day of the month (0=Sun, 1=Mon, ..., 6=Sat)
    const firstDay = new Date(year, monthIndex, 1).getDay();

    // Aggregate daily totals for the filtered expenses
    const dailyTotals = {};
    expenses.forEach(exp => {
        const d = new Date(exp.date).getDate();
        dailyTotals[d] = (dailyTotals[d] || 0) + exp.amount;
    });

    // Create calendar grid
    const days = [];
    // Padding for days of the week before the 1st
    for (let i = 0; i < firstDay; i++) {
        days.push(<div key={`empty-${i}`} className="calendar-day empty"></div>);
    }

    // Days of the month
    for (let d = 1; d <= daysInMonth; d++) {
        const total = dailyTotals[d] || 0;
        const isToday = new Date().toDateString() === new Date(year, monthIndex, d).toDateString();

        days.push(
            <div key={d} className={`calendar-day ${isToday ? 'today' : ''}`}>
                <span className="day-number">{d}</span>
                {total > 0 && (
                    <span className="day-total">{total.toLocaleString()}đ</span>
                )}
            </div>
        );
    }

    const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    return (
        <div className="glass-card calendar-card">
            <h5 className="calendar-header">Monthly Spending Calendar</h5>
            <div className="calendar-grid">
                {weekDays.map(wd => (
                    <div key={wd} className="calendar-weekday">{wd}</div>
                ))}
                {days}
            </div>
        </div>
    );
}
