"use client";

import { useState } from "react";
import { formatAED } from "@/lib/pricing";

export function SavingsCalculator() {
  const [monthlyBookings, setMonthlyBookings] = useState<number>(25);
  const [avgBookingValue, setAvgBookingValue] = useState<number>(850);
  const [commissionRate, setCommissionRate] = useState<number>(15);

  const monthlySavings = Math.round(monthlyBookings * avgBookingValue * (commissionRate / 100));
  const yearlySavings = monthlySavings * 12;

  return (
    <div className="bg-surface border border-subtle rounded-sm p-6 sm:p-8 space-y-6 shadow-xl font-mono">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-subtle">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-accent text-xs uppercase tracking-wider">
            <span>•</span>
            <span>DIRECT REVENUE SIMULATOR</span>
          </div>
          <h3 className="font-serif text-xl sm:text-2xl text-on-dark uppercase tracking-tight font-normal">
            Direct Channel Savings Calculator
          </h3>
        </div>
        <span className="text-[11px] text-muted-dark bg-base px-3 py-1 rounded-sm border border-subtle self-start sm:self-auto">
          Illustrative estimate, not a guarantee.
        </span>
      </div>

      {/* Sliders Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Monthly Bookings */}
        <div className="space-y-2">
          <div className="flex justify-between items-center text-xs">
            <label htmlFor="calc-bookings" className="text-muted-dark uppercase tracking-wider text-[11px]">
              Direct Bookings / Mo
            </label>
            <span className="text-on-dark">{monthlyBookings} stays</span>
          </div>
          <input
            id="calc-bookings"
            type="range"
            min="5"
            max="100"
            step="1"
            value={monthlyBookings}
            onChange={(e) => setMonthlyBookings(Number(e.target.value))}
            className="w-full accent-accent cursor-pointer h-1.5 bg-base rounded-sm"
          />
          <div className="flex justify-between text-[10px] text-muted-dark">
            <span>5</span>
            <span>50</span>
            <span>100</span>
          </div>
        </div>

        {/* Avg Booking Value */}
        <div className="space-y-2">
          <div className="flex justify-between items-center text-xs">
            <label htmlFor="calc-avg-value" className="text-muted-dark uppercase tracking-wider text-[11px]">
              Avg. Booking Value (AED)
            </label>
            <span className="text-on-dark">{formatAED(avgBookingValue)}</span>
          </div>
          <input
            id="calc-avg-value"
            type="range"
            min="200"
            max="3000"
            step="50"
            value={avgBookingValue}
            onChange={(e) => setAvgBookingValue(Number(e.target.value))}
            className="w-full accent-accent cursor-pointer h-1.5 bg-base rounded-sm"
          />
          <div className="flex justify-between text-[10px] text-muted-dark">
            <span>AED 200</span>
            <span>AED 1,500</span>
            <span>AED 3,000</span>
          </div>
        </div>

        {/* Channel Value Margin */}
        <div className="space-y-2">
          <div className="flex justify-between items-center text-xs">
            <label htmlFor="calc-commission" className="text-muted-dark uppercase tracking-wider text-[11px]">
              Direct Privilege Margin
            </label>
            <span className="text-accent">{commissionRate}%</span>
          </div>
          <input
            id="calc-commission"
            type="range"
            min="10"
            max="25"
            step="1"
            value={commissionRate}
            onChange={(e) => setCommissionRate(Number(e.target.value))}
            className="w-full accent-accent cursor-pointer h-1.5 bg-base rounded-sm"
          />
          <div className="flex justify-between text-[10px] text-muted-dark">
            <span>10%</span>
            <span>15% (Typical)</span>
            <span>25%</span>
          </div>
        </div>
      </div>

      {/* Results Comparison Block */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
        <div className="bg-base border border-subtle p-5 rounded-sm space-y-1">
          <span className="text-[10px] uppercase tracking-wider text-muted-dark block">
            ESTIMATED MONTHLY SAVINGS
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl text-success font-medium">
              {formatAED(monthlySavings)}
            </span>
            <span className="text-xs text-muted-dark">retained per month</span>
          </div>
          <p className="text-[11px] text-muted-dark pt-1 font-sans font-light">
            Reinvested into guest amenities, pool care, and high-speed infrastructure.
          </p>
        </div>

        <div className="bg-base border border-accent/40 p-5 rounded-sm space-y-1 relative overflow-hidden">
          <span className="text-[10px] uppercase tracking-wider text-accent block flex items-center justify-between">
            <span>ESTIMATED ANNUAL IMPACT</span>
            <span>↗</span>
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl text-accent font-medium">
              {formatAED(yearlySavings)}
            </span>
            <span className="text-xs text-muted-dark">retained annually</span>
          </div>
          <p className="text-[11px] text-muted-dark pt-1 font-sans font-light">
            Enables offering guests a guaranteed 15% direct booking benefit.
          </p>
        </div>
      </div>
    </div>
  );
}
