"use client";

import React from "react";

const DEFAULT_TAGS = [
  "Antibiotics",
  "Pain Relief",
  "Cardiac Care",
  "Diabetic Care",
  "Respiratory",
  "Gastrointestinal",
  "Dermatology",
  "Vitamins & Minerals",
  "Pediatric Safe",
  "Cold Chain (2-8°C)",
  "First Aid",
  "Schedule H Rx",
  "Schedule H1",
  "OTC Medicine",
  "Ayurvedic",
];

interface TagMultiSelectProps {
  tags?: string[];
  selectedTags: string[];
  onChange: (selected: string[]) => void;
}

export function TagMultiSelect({
  tags = DEFAULT_TAGS,
  selectedTags = ["Antibiotics", "Schedule H Rx"],
  onChange,
}: TagMultiSelectProps) {
  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      onChange(selectedTags.filter((t) => t !== tag));
    } else {
      onChange([...selectedTags, tag]);
    }
  };

  return (
    <div className="space-y-3">
      {/* Selected tags summary box */}
      <div className="p-3 bg-[#F1F3F4] rounded-xl text-xs text-[#0F2A22] font-medium min-h-[38px] flex items-center">
        {selectedTags.length > 0 ? (
          <span>{selectedTags.join(", ")}</span>
        ) : (
          <span className="text-[#5B6B65]">Select tags from below</span>
        )}
      </div>

      {/* 3-Column Checkbox Grid matching reference screenshot */}
      <div className="grid grid-cols-3 gap-y-2.5 gap-x-2 py-1">
        {tags.map((tag) => {
          const isChecked = selectedTags.includes(tag);
          return (
            <label
              key={tag}
              onClick={() => toggleTag(tag)}
              className="flex items-center gap-2 text-xs text-[#0F2A22] cursor-pointer select-none group"
            >
              <div
                className={`w-4 h-4 rounded-full border flex items-center justify-center transition-all ${
                  isChecked
                    ? "border-[#0B4A3A] bg-white"
                    : "border-[#C5CCD2] bg-white group-hover:border-[#0B4A3A]"
                }`}
              >
                {isChecked && <div className="w-2 h-2 rounded-full bg-[#0B4A3A]" />}
              </div>
              <span className={`text-[12px] ${isChecked ? "font-semibold text-[#0F2A22]" : "text-[#5B6B65]"}`}>
                {tag}
              </span>
            </label>
          );
        })}
      </div>

      {/* Select Tags CTA Button */}
      <button
        type="button"
        className="w-full py-2.5 text-xs font-semibold text-white bg-[#0B4A3A] rounded-xl hover:bg-[#07362a] transition shadow-sm"
      >
        Select Tags
      </button>
    </div>
  );
}
