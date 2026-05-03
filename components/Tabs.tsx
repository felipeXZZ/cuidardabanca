'use client';

import { motion } from 'framer-motion';

export interface TabItem {
  label: string;
  value: string | number;
}

interface TabsProps {
  tabs: TabItem[];
  active: string | number;
  onChange: (value: string | number) => void;
}

export default function Tabs({ tabs, active, onChange }: TabsProps) {
  return (
    <div className="flex gap-1 bg-[#F1F5F9] dark:bg-[#0F172A] p-1 rounded-lg w-fit">
      {tabs.map((tab) => (
        <button
          key={tab.value}
          type="button"
          onClick={() => onChange(tab.value)}
          className="relative px-4 py-1.5 text-sm font-medium rounded-md transition-colors"
        >
          {active === tab.value && (
            <motion.div
              layoutId="activeTabBg"
              className="absolute inset-0 bg-white dark:bg-[#1E293B] rounded-md shadow-sm"
              transition={{ type: 'spring', bounce: 0.2, duration: 0.35 }}
            />
          )}
          <span className={`relative z-10 transition-colors ${
            active === tab.value
              ? 'text-[#0F172A] dark:text-[#F1F5F9] font-semibold'
              : 'text-[#64748B] dark:text-[#94A3B8]'
          }`}>
            {tab.label}
          </span>
        </button>
      ))}
    </div>
  );
}
