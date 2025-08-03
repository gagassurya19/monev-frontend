import React, { useState, useEffect, useCallback } from 'react';
import { ChevronDown, Search, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { getFakultas, getProdi, getMatkul } from '@/lib/api/activity';
import { FilterOption, MatkulFilterOption } from '@/lib/types';

interface FilterDropdownProps {
  type: 'fakultas' | 'prodi' | 'matkul';
  value: string;
  onValueChange: (value: string, displayName?: string) => void;
  placeholder: string;
  disabled?: boolean;
  fakultasId?: string;
  prodiId?: string;
  kampus?: string;
}

export function FilterDropdown({
  type,
  value,
  onValueChange,
  placeholder,
  disabled = false,
  fakultasId,
  prodiId,
  kampus = 'bdg'
}: FilterDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [items, setItems] = useState<(FilterOption | MatkulFilterOption)[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null);

  const fetchItems = useCallback(async (search = '', pageNum = 1, append = false) => {
    if (disabled) return;

    setLoading(true);
    try {
      let response;
      
      if (type === 'fakultas') {
        response = await getFakultas(search, pageNum, 20);
      } else if (type === 'prodi') {
        if (!fakultasId) return;
        response = await getProdi(fakultasId, kampus, search, pageNum, 20);
      } else if (type === 'matkul') {
        if (!prodiId) return;
        response = await getMatkul(prodiId, search, pageNum, 20);
      }

      if (response) {
        const newItems = response.data;
        if (append) {
          setItems(prev => [...prev, ...newItems]);
        } else {
          setItems(newItems);
        }
        setHasMore(response.hasNextPage);
        setPage(pageNum);
      }
    } catch (error) {
      console.error(`Error fetching ${type}:`, error);
    } finally {
      setLoading(false);
    }
  }, [type, disabled, fakultasId, prodiId, kampus]);

  // Initial load
  useEffect(() => {
    if (!disabled) {
      fetchItems('', 1, false);
    }
  }, [fetchItems, disabled]);

  // Handle search with debounce
  useEffect(() => {
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }

    const timeout = setTimeout(() => {
      fetchItems(searchTerm, 1, false);
    }, 300);

    setSearchTimeout(timeout);

    return () => {
      if (timeout) clearTimeout(timeout);
    };
  }, [searchTerm, fetchItems]);

  const handleScroll = useCallback((event: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = event.currentTarget;
    if (scrollHeight - scrollTop <= clientHeight * 1.5 && hasMore && !loading) {
      fetchItems(searchTerm, page + 1, true);
    }
  }, [fetchItems, searchTerm, page, hasMore, loading]);

  const handleSelect = (selectedValue: string) => {
    const selectedItem = items.find(item => getItemValue(item) === selectedValue);
    const displayName = selectedItem ? getDisplayValue(selectedItem) : selectedValue;
    onValueChange(selectedValue, displayName);
    setIsOpen(false);
  };

  const getDisplayValue = (item: FilterOption | MatkulFilterOption) => {
    if (type === 'matkul') {
      const matkulItem = item as MatkulFilterOption;
      return `${matkulItem.subject_code} - ${matkulItem.subject_name}`;
    }
    return (item as FilterOption).category_name;
  };

  const getItemValue = (item: FilterOption | MatkulFilterOption) => {
    if (type === 'matkul') {
      return (item as MatkulFilterOption).subject_id.toString();
    }
    return (item as FilterOption).category_id.toString();
  };

  return (
    <div className="relative">
      <Select
        value={value}
        onValueChange={handleSelect}
        disabled={disabled}
        open={isOpen}
        onOpenChange={setIsOpen}
      >
        <SelectTrigger className="w-auto min-w-[140px] border-gray-300 shadow-sm text-sm font-medium text-gray-700 focus:ring-red-500 focus:border-red-500">
          <SelectValue placeholder={placeholder} />
          <ChevronDown className="h-4 w-4 opacity-50" />
        </SelectTrigger>
        <SelectContent className="w-[300px] p-0">
          <div className="p-2 border-b">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
              <Input
                placeholder={`Search ${type}...`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>
          <ScrollArea className="h-[200px]" onScroll={handleScroll}>
            <div className="p-1">
              {items.map((item) => (
                <SelectItem
                  key={getItemValue(item)}
                  value={getItemValue(item)}
                  className="cursor-pointer"
                >
                  {getDisplayValue(item)}
                </SelectItem>
              ))}
              {loading && (
                <div className="flex items-center justify-center py-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                </div>
              )}
              {!hasMore && items.length > 0 && (
                <div className="text-xs text-gray-500 text-center py-2">
                  No more items
                </div>
              )}
              {!loading && items.length === 0 && (
                <div className="text-xs text-gray-500 text-center py-2">
                  No items found
                </div>
              )}
            </div>
          </ScrollArea>
        </SelectContent>
      </Select>
    </div>
  );
} 