"use client";
import React from "react";

interface ClientDateProps {
  dateString: string;
  formatOptions?: Intl.DateTimeFormatOptions;
  className?: string;
}

export default function ClientDate({ 
  dateString, 
  formatOptions,
  className 
}: ClientDateProps) {
  const [formattedDate, setFormattedDate] = React.useState<string>("");

  React.useEffect(() => {
    if (!dateString) {
      setFormattedDate("");
      return;
    }

    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        setFormattedDate("Invalid Date");
        return;
      }

      const formatted = date.toLocaleString('id-ID', formatOptions || {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
      setFormattedDate(formatted);
    } catch (error) {
      console.error('Error formatting date:', error);
      setFormattedDate("Invalid Date");
    }
  }, [dateString, formatOptions]);

  if (!dateString) return null;

  return (
    <span className={className}>
      {formattedDate || "Loading..."}
    </span>
  );
} 