import { z } from "zod";
import { rooms } from "@/data/rooms";
import { propertyPolicies } from "@/data/policies";

export const validRoomIds = [
  "premium-single-capsule",
  "deluxe-double-capsule",
  "executive-private-suite",
] as const;

// 1. Booking Creation Schema (Strict backend & widget validation)
export const bookingCreationSchema = z
  .object({
    guestName: z
      .string()
      .trim()
      .min(2, { message: "Please enter your full name (at least 2 characters)" })
      .max(100, { message: "Name is too long" }),
    guestPhone: z
      .string()
      .trim()
      .min(7, { message: "Please provide a valid phone number (at least 7 digits)" })
      .max(30, { message: "Phone number is too long" }),
    guestEmail: z
      .string()
      .trim()
      .email({ message: "Please provide a valid email address" })
      .optional()
      .or(z.literal("")),
    roomId: z.enum(validRoomIds, {
      errorMap: () => ({ message: "Please select a valid capsule pod or suite" }),
    }),
    checkIn: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, { message: "Check-in date must be in YYYY-MM-DD format" }),
    checkOut: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, { message: "Check-out date must be in YYYY-MM-DD format" }),
    adults: z.coerce
      .number()
      .int()
      .min(1, { message: "At least 1 adult guest is required" })
      .max(2, { message: "Maximum 2 adults per capsule or suite" }),
    promoCode: z.string().trim().default("RIZQDIRECT"),
    notes: z
      .string()
      .max(600, { message: "Notes cannot exceed 600 characters" })
      .optional()
      .or(z.literal("")),
    addons: z.array(z.string()).default([]),
    honeypot: z
      .string()
      .max(0, { message: "Spam detected" })
      .optional()
      .or(z.literal("")),
  })
  .refine(
    (data) => {
      const checkInDate = new Date(data.checkIn);
      const checkOutDate = new Date(data.checkOut);
      return !isNaN(checkInDate.getTime()) && !isNaN(checkOutDate.getTime()) && checkOutDate > checkInDate;
    },
    {
      message: "Check-out date must be after check-in date",
      path: ["checkOut"],
    }
  )
  .refine(
    (data) => {
      const room = rooms.find((r) => r.id === data.roomId);
      return room ? data.adults <= room.maxGuests : true;
    },
    {
      message: "Adult guest count exceeds maximum capacity for this space",
      path: ["adults"],
    }
  );

export type BookingCreationInput = z.infer<typeof bookingCreationSchema>;

// Legacy inquiry schema preserved for backwards compatibility
export const inquirySchema = z
  .object({
    guestName: z
      .string()
      .trim()
      .min(2, { message: "Please enter your full name (at least 2 characters)" })
      .max(100, { message: "Name is too long" }),
    guestEmail: z
      .string()
      .trim()
      .email({ message: "Please provide a valid email address" })
      .optional()
      .or(z.literal("")),
    guestPhone: z
      .string()
      .trim()
      .max(30, { message: "Phone number is too long" })
      .optional()
      .or(z.literal("")),
    roomId: z.enum(validRoomIds, {
      errorMap: () => ({ message: "Please select a valid capsule pod or suite" }),
    }),
    checkIn: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, { message: "Check-in date must be in YYYY-MM-DD format" }),
    checkOut: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, { message: "Check-out date must be in YYYY-MM-DD format" }),
    guests: z.coerce
      .number()
      .int()
      .min(1, { message: "At least 1 guest is required" })
      .max(2, { message: "Maximum 2 guests per capsule or suite" }),
    promoCode: z.string().trim().default("RIZQDIRECT"),
    specialRequests: z
      .string()
      .max(600, { message: "Special requests cannot exceed 600 characters" })
      .optional()
      .or(z.literal("")),
    honeypot: z
      .string()
      .max(0, { message: "Spam detected" })
      .optional()
      .or(z.literal("")),
  })
  .refine(
    (data) => {
      const checkInDate = new Date(data.checkIn);
      const checkOutDate = new Date(data.checkOut);
      return !isNaN(checkInDate.getTime()) && !isNaN(checkOutDate.getTime()) && checkOutDate > checkInDate;
    },
    {
      message: "Check-out date must be after check-in date",
      path: ["checkOut"],
    }
  )
  .refine(
    (data) => {
      const room = rooms.find((r) => r.id === data.roomId);
      return room ? data.guests <= room.maxGuests : true;
    },
    {
      message: "Guest count exceeds maximum capacity for this space",
      path: ["guests"],
    }
  );

export type InquiryInput = z.infer<typeof inquirySchema>;
