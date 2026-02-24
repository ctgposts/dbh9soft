import { useState, useRef, useEffect } from "react";
import { toast } from "sonner";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";

interface EditableComboboxProps {
  value: string;
  onChange: (value: string) => void;
  options: string[];
  type: "fabric" | "embellishment" | "category";
  placeholder?: string;
  onNewOptionAdded?: () => void;
}

export function EditableCombobox({
  value,
  onChange,
  options,
  type,
  placeholder = "Select or type new...",
  onNewOptionAdded,
}: EditableComboboxProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState(value);
  const [isAdding, setIsAdding] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Backend mutations
  const addFabricOption = useMutation(api.dropdownOptions.addFabricOption);
  const addEmbellishmentOption = useMutation(
    api.dropdownOptions.addEmbellishmentOption
  );
  const addCategory = useMutation(api.dropdownOptions.addCategory);

  // Filter suggestions based on input
  const filteredOptions = options.filter((opt) =>
    opt.toLowerCase().includes(inputValue.toLowerCase())
  );

  const isNewValue =
    inputValue.trim() && !options.includes(inputValue.trim());

  useEffect(() => {
    // Close dropdown when clicking outside
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (selectedValue: string) => {
    onChange(selectedValue);
    setInputValue(selectedValue);
    setIsOpen(false);
  };

  const handleAddNew = async () => {
    if (!inputValue.trim()) {
      toast.error("Please enter a value");
      return;
    }

    if (options.includes(inputValue.trim())) {
      toast.info("This option already exists");
      handleSelect(inputValue.trim());
      return;
    }

    setIsAdding(true);
    try {
      if (type === "fabric") {
        await addFabricOption({ name: inputValue.trim() });
      } else if (type === "embellishment") {
        await addEmbellishmentOption({ name: inputValue.trim() });
      } else if (type === "category") {
        await addCategory({
          name: inputValue.trim(),
          description: "",
          color: "#9333ea", // Default purple
        });
      }

      toast.success(`✅ Added new ${type}: ${inputValue.trim()}`);
      onChange(inputValue.trim());
      setIsOpen(false);
      onNewOptionAdded?.();
    } catch (error) {
      console.error(`Failed to add ${type}:`, error);
      toast.error(
        `Failed to add ${type}: ${error instanceof Error ? error.message : String(error)}`
      );
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <div ref={containerRef} className="relative w-full">
      <div
        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus-within:ring-2 focus-within:ring-purple-500 focus-within:border-transparent transition-all cursor-text bg-white flex items-center justify-between"
        onClick={() => setIsOpen(!isOpen)}
      >
        <input
          type="text"
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value);
            onChange(e.target.value);
            setIsOpen(true);
          }}
          placeholder={placeholder}
          onFocus={() => setIsOpen(true)}
          className="flex-1 outline-none bg-transparent text-sm"
        />
        <div className="flex gap-2 ml-2">
          {isNewValue && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleAddNew();
              }}
              disabled={isAdding}
              className="px-2 py-1 bg-purple-500 text-white text-xs rounded hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              title="Add this as a new option"
            >
              {isAdding ? "Adding..." : "+Add"}
            </button>
          )}
          <svg
            className={`w-5 h-5 text-gray-400 transition-transform ${
              isOpen ? "rotate-180" : ""
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 14l-7 7m0 0l-7-7m7 7V3"
            />
          </svg>
        </div>
      </div>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-50 max-h-64 overflow-y-auto">
          {filteredOptions.length > 0 ? (
            <div className="py-2">
              {filteredOptions.map((option) => (
                <button
                  key={option}
                  onClick={() => handleSelect(option)}
                  className={`w-full text-left px-3 py-2 hover:bg-purple-50 transition-colors ${
                    value === option ? "bg-purple-100 font-semibold" : ""
                  }`}
                >
                  {option}
                  {value === option && <span className="float-right">✓</span>}
                </button>
              ))}
            </div>
          ) : inputValue.trim() ? (
            <div className="py-2 px-3 text-sm text-gray-500">
              No options found for "{inputValue}"
            </div>
          ) : (
            <div className="py-2">
              {options.length > 0 ? (
                options.map((option) => (
                  <button
                    key={option}
                    onClick={() => handleSelect(option)}
                    className={`w-full text-left px-3 py-2 hover:bg-purple-50 transition-colors ${
                      value === option ? "bg-purple-100 font-semibold" : ""
                    }`}
                  >
                    {option}
                    {value === option && <span className="float-right">✓</span>}
                  </button>
                ))
              ) : (
                <div className="py-2 px-3 text-sm text-gray-500">
                  No options available. Type to add one!
                </div>
              )}
            </div>
          )}

          {/* Add new option button when filtering shows nothing but input is new */}
          {isNewValue && filteredOptions.length === 0 && (
            <div className="border-t border-gray-200 py-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleAddNew();
                }}
                disabled={isAdding}
                className="w-full text-left px-3 py-2 text-purple-600 hover:bg-purple-50 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isAdding
                  ? "Adding..."
                  : `✨ Add new: "${inputValue.trim()}"`}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
