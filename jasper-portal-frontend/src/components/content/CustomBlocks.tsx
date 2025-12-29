"use client";

/**
 * Custom BlockNote Blocks for JASPER Content Hub
 *
 * Custom blocks:
 * - Callout: Info, Warning, Success, Error variants with icons
 * - Infographic: Comparison, Timeline, Stats layouts (future)
 *
 * These extend BlockNote's block system with JASPER-specific blocks.
 */

import { createReactBlockSpec } from "@blocknote/react";
import { defaultProps } from "@blocknote/core";
import { useState, useCallback } from "react";
import {
  AlertCircle,
  Info,
  CheckCircle,
  AlertTriangle,
  ChevronDown,
} from "lucide-react";

// Callout variants with their styling
const calloutVariants = {
  info: {
    icon: Info,
    bgColor: "bg-blue-50",
    borderColor: "border-blue-200",
    iconColor: "text-blue-600",
    textColor: "text-blue-800",
    label: "Info",
  },
  warning: {
    icon: AlertTriangle,
    bgColor: "bg-yellow-50",
    borderColor: "border-yellow-200",
    iconColor: "text-yellow-600",
    textColor: "text-yellow-800",
    label: "Warning",
  },
  success: {
    icon: CheckCircle,
    bgColor: "bg-green-50",
    borderColor: "border-green-200",
    iconColor: "text-green-600",
    textColor: "text-green-800",
    label: "Success",
  },
  error: {
    icon: AlertCircle,
    bgColor: "bg-red-50",
    borderColor: "border-red-200",
    iconColor: "text-red-600",
    textColor: "text-red-800",
    label: "Error",
  },
} as const;

type CalloutVariant = keyof typeof calloutVariants;

/**
 * Callout Block Component
 * A highlighted message box with icon and styled background
 */
interface CalloutBlockProps {
  block: {
    id: string;
    props: {
      variant: CalloutVariant;
    };
    content: any;
  };
  editor: any;
  contentRef: any;
}

function CalloutBlockComponent({ block, editor, contentRef }: CalloutBlockProps) {
  const [showVariantPicker, setShowVariantPicker] = useState(false);
  const variant = calloutVariants[block.props.variant] || calloutVariants.info;
  const Icon = variant.icon;

  const changeVariant = useCallback(
    (newVariant: CalloutVariant) => {
      editor.updateBlock(block, {
        type: "callout",
        props: { variant: newVariant },
      });
      setShowVariantPicker(false);
    },
    [editor, block]
  );

  return (
    <div
      className={`relative flex items-start gap-3 p-4 rounded-lg border ${variant.bgColor} ${variant.borderColor}`}
    >
      {/* Variant Picker */}
      <div className="relative">
        <button
          type="button"
          onClick={() => setShowVariantPicker(!showVariantPicker)}
          className={`flex items-center gap-1 p-1.5 rounded hover:bg-white/50 transition-colors ${variant.iconColor}`}
          title="Change callout type"
        >
          <Icon className="w-5 h-5" />
          <ChevronDown className="w-3 h-3" />
        </button>

        {showVariantPicker && (
          <div className="absolute top-full left-0 mt-1 z-10 bg-white rounded-lg shadow-lg border p-1 min-w-[120px]">
            {Object.entries(calloutVariants).map(([key, val]) => {
              const ItemIcon = val.icon;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => changeVariant(key as CalloutVariant)}
                  className={`flex items-center gap-2 w-full px-2 py-1.5 text-sm rounded hover:bg-gray-100 ${val.textColor}`}
                >
                  <ItemIcon className="w-4 h-4" />
                  {val.label}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Editable Content */}
      <div
        className={`flex-1 ${variant.textColor}`}
        ref={contentRef}
        contentEditable
        suppressContentEditableWarning
      />
    </div>
  );
}

/**
 * Create the Callout block specification
 */
export const CalloutBlock = createReactBlockSpec(
  {
    type: "callout",
    propSchema: {
      textAlignment: defaultProps.textAlignment,
      variant: {
        default: "info" as CalloutVariant,
        values: ["info", "warning", "success", "error"] as const,
      },
    },
    content: "inline",
  },
  {
    render: (props) => (
      <CalloutBlockComponent
        block={props.block}
        editor={props.editor}
        contentRef={props.contentRef}
      />
    ),
  }
);

/**
 * Stats Block Component (for infographic-style stats display)
 * Uses JSON string for stats data since BlockNote props only accept primitives
 */
interface StatsBlockProps {
  block: {
    id: string;
    props: {
      statsJson: string; // JSON string of stats array
    };
    content: any;
  };
  editor: any;
}

interface StatItem {
  value: string;
  label: string;
}

function StatsBlockComponent({ block, editor }: StatsBlockProps) {
  // Parse stats from JSON string
  let stats: StatItem[] = [];
  try {
    stats = block.props.statsJson ? JSON.parse(block.props.statsJson) : [];
  } catch {
    stats = [];
  }

  // Default stats if empty
  if (!stats || stats.length === 0) {
    stats = [
      { value: "0", label: "Statistic 1" },
      { value: "0", label: "Statistic 2" },
      { value: "0", label: "Statistic 3" },
    ];
  }

  const updateStats = useCallback(
    (newStats: StatItem[]) => {
      editor.updateBlock(block, {
        type: "stats",
        props: { statsJson: JSON.stringify(newStats) },
      });
    },
    [editor, block]
  );

  const updateStat = useCallback(
    (index: number, field: "value" | "label", newValue: string) => {
      const newStats = [...stats];
      newStats[index] = { ...newStats[index], [field]: newValue };
      updateStats(newStats);
    },
    [stats, updateStats]
  );

  const addStat = useCallback(() => {
    const newStats = [...stats, { value: "0", label: "New Stat" }];
    updateStats(newStats);
  }, [stats, updateStats]);

  const removeStat = useCallback(
    (index: number) => {
      const newStats = stats.filter((_, i) => i !== index);
      updateStats(newStats);
    },
    [stats, updateStats]
  );

  return (
    <div className="bg-gradient-to-r from-emerald-50 to-blue-50 rounded-lg p-6 border border-emerald-100">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {stats.map((stat, index) => (
          <div
            key={index}
            className="relative text-center p-4 bg-white rounded-lg shadow-sm"
          >
            <button
              type="button"
              onClick={() => removeStat(index)}
              className="absolute top-1 right-1 p-1 text-gray-400 hover:text-red-500 rounded"
              title="Remove stat"
            >
              ×
            </button>
            <input
              type="text"
              value={stat.value}
              onChange={(e) => updateStat(index, "value", e.target.value)}
              className="text-3xl font-bold text-emerald-600 w-full text-center bg-transparent border-none focus:outline-none focus:ring-2 focus:ring-emerald-300 rounded"
              placeholder="0"
            />
            <input
              type="text"
              value={stat.label}
              onChange={(e) => updateStat(index, "label", e.target.value)}
              className="text-sm text-gray-600 w-full text-center bg-transparent border-none focus:outline-none focus:ring-2 focus:ring-emerald-300 rounded mt-1"
              placeholder="Label"
            />
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={addStat}
        className="mt-4 w-full py-2 text-sm text-emerald-600 hover:bg-emerald-100 rounded-lg border border-dashed border-emerald-300 transition-colors"
      >
        + Add Stat
      </button>
    </div>
  );
}

/**
 * Create the Stats block specification
 * Uses JSON string for stats data since BlockNote props only accept primitives
 */
export const StatsBlock = createReactBlockSpec(
  {
    type: "stats",
    propSchema: {
      statsJson: {
        default: "[]",
      },
    },
    content: "none",
  },
  {
    render: (props) => (
      <StatsBlockComponent block={props.block} editor={props.editor} />
    ),
  }
);

/**
 * Divider Block - Simple horizontal rule
 */
function DividerBlockComponent() {
  return (
    <div className="py-4">
      <hr className="border-t-2 border-gray-200" />
    </div>
  );
}

export const DividerBlock = createReactBlockSpec(
  {
    type: "divider",
    propSchema: {},
    content: "none",
  },
  {
    render: () => <DividerBlockComponent />,
  }
);

/**
 * Export all custom blocks as a schema extension
 */
export const customBlockSchema = {
  callout: CalloutBlock,
  stats: StatsBlock,
  divider: DividerBlock,
};

// Export individual blocks for direct use
export { CalloutBlock as Callout };
export { StatsBlock as Stats };
export { DividerBlock as Divider };
