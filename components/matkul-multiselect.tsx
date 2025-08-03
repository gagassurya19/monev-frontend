import React, { useState, useEffect, useCallback } from "react";
import { getMatkul } from "@/lib/api/activity";
import { MatkulFilterOption } from "@/lib/types";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, X } from "lucide-react";

interface MataKuliahMultiSelectProps {
  prodiId: string;
  value: MatkulFilterOption[];
  onChange: (selected: MatkulFilterOption[]) => void;
  disabled?: boolean;
}

export function MataKuliahMultiSelect({
  prodiId,
  value,
  onChange,
  disabled = false,
}: MataKuliahMultiSelectProps) {
  const [search, setSearch] = useState("");
  const [options, setOptions] = useState<MatkulFilterOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);

  // Fetch mata kuliah
  const fetchOptions = useCallback(
    async (searchTerm = "", pageNum = 1, append = false) => {
      if (!prodiId) return;
      setLoading(true);
      try {
        const res = await getMatkul(prodiId, searchTerm, pageNum, 20);
        if (append) {
          setOptions((prev) => [...prev, ...res.data]);
        } else {
          setOptions(res.data);
        }
        setHasMore(res.hasNextPage);
        setPage(pageNum);
      } catch (e) {
        setOptions([]);
        setHasMore(false);
      } finally {
        setLoading(false);
      }
    },
    [prodiId]
  );

  // Initial and search load
  useEffect(() => {
    if (prodiId) fetchOptions(search, 1, false);
    else setOptions([]);
  }, [prodiId, search, fetchOptions]);

  // Infinite scroll
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    if (scrollHeight - scrollTop <= clientHeight * 1.5 && hasMore && !loading) {
      fetchOptions(search, page + 1, true);
    }
  };

  // Add/remove selection
  const toggleSelect = (item: MatkulFilterOption) => {
    if (value.some((v) => v.subject_id === item.subject_id)) {
      onChange(value.filter((v) => v.subject_id !== item.subject_id));
    } else {
      onChange([...value, item]);
    }
  };

  // Remove tag
  const removeTag = (id: number) => {
    onChange(value.filter((v) => v.subject_id !== id));
  };

  return (
    <div>
      <div className="mb-2 flex flex-wrap gap-1">
        {value.map((item) => (
          <span
            key={item.subject_id}
            className="inline-flex items-center bg-gray-100 rounded px-2 py-1 text-xs mr-1 mb-1"
          >
            {item.subject_code} - {item.subject_name}
            <button
              type="button"
              className="ml-1 text-gray-400 hover:text-red-500"
              onClick={() => removeTag(item.subject_id)}
              tabIndex={-1}
            >
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}
      </div>
      <div className="relative">
        <Input
          placeholder="Cari Mata Kuliah..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          disabled={disabled || !prodiId}
          className="mb-1"
        />
        <ScrollArea
          className="h-48 border rounded"
          onScroll={handleScroll}
        >
          <div>
            {options.map((item) => {
              const selected = value.some((v) => v.subject_id === item.subject_id);
              return (
                <div
                  key={item.subject_id}
                  className={`flex items-center px-2 py-1 cursor-pointer hover:bg-gray-100 ${
                    selected ? "bg-gray-200" : ""
                  }`}
                  onClick={() => toggleSelect(item)}
                >
                  <input
                    type="checkbox"
                    checked={selected}
                    readOnly
                    className="mr-2"
                  />
                  <span>
                    {item.subject_code} - {item.subject_name}
                  </span>
                </div>
              );
            })}
            {loading && (
              <div className="flex justify-center py-2">
                <Loader2 className="animate-spin w-4 h-4" />
              </div>
            )}
            {!loading && options.length === 0 && (
              <div className="text-xs text-gray-400 text-center py-2">
                Tidak ada data
              </div>
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}