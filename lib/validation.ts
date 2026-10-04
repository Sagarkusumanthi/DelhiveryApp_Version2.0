import { z } from "zod";
import { ORDER_STATUS_VALUES } from "./constants";

export const phoneRegex = /^[6-9]\d{9}$/;

export const loginSchema = z.object({
  identifier: z.string().trim().min(1, "Enter your email or phone number"),
  password: z.string().min(1, "Enter your password"),
});

export const recipientSchema = z.object({
  recipientFirstName: z
    .string()
    .trim()
    .min(1, "Enter a first name")
    .regex(/^[A-Za-z]+(?:[ '-][A-Za-z]+)*$/, "Name can only contain letters"),
  recipientLastName: z
    .string()
    .trim()
    .min(1, "Enter a last name")
    .regex(/^[A-Za-z]+(?:[ '-][A-Za-z]+)*$/, "Name can only contain letters"),
  recipientPhone: z.string().trim().regex(phoneRegex, "Enter a valid 10-digit phone number starting with 6-9"),
  recipientAddress: z.string().trim().min(10, "Enter a complete delivery address (min 10 characters)"),
});

export const occasionEnum = z.enum(["Birthday", "Anniversary", "Thank you", "Congratulations", "Just because"]);
export const deliveryOptionEnum = z.enum(["STANDARD", "EXPRESS", "SCHEDULED"]);
export const paymentMethodEnum = z.enum(["CARD", "UPI", "COD"]);

export const orderItemSchema = z.object({
  productId: z.string().min(1),
  qty: z.number().int().min(1).max(10),
});

export const checkoutSchema = recipientSchema.merge(
  z.object({
    items: z.array(orderItemSchema).min(1, "Your cart is empty"),
    occasion: occasionEnum.optional(),
    message: z.string().trim().max(250, "Message can be at most 250 characters").optional().or(z.literal("")),
    sender: z.string().trim().max(60).optional().or(z.literal("")),
    deliveryOption: deliveryOptionEnum,
    paymentMethod: paymentMethodEnum,
  })
);
export type CheckoutInput = z.infer<typeof checkoutSchema>;

export const reasonRequiredSchema = z.object({
  reason: z.string().trim().min(3, "Please provide a reason (min 3 characters)"),
});

export const statusTransitionSchema = z.object({
  status: z.enum(ORDER_STATUS_VALUES),
  reason: z.string().trim().optional(),
});

export const adminOverrideSchema = z.object({
  targetStatus: z.enum(ORDER_STATUS_VALUES),
  reason: z.string().trim().min(3, "Please provide a reason (min 3 characters)"),
});

export const deliveryConfirmationSchema = z.object({
  confirmed: z.boolean(),
  photoDataUrl: z.string().optional(),
});

export const productFormSchema = z.object({
  name: z.string().trim().min(2, "Enter a product name"),
  description: z.string().trim().optional().or(z.literal("")),
  price: z
    .number({ invalid_type_error: "Enter a price" })
    .finite()
    .gt(0, "Price must be greater than zero"),
  featured: z.boolean().optional(),
  isAvailable: z.boolean().optional(),
});

export const storeProfileSchema = z.object({
  name: z.string().trim().min(1).optional(),
  description: z.string().trim().optional().or(z.literal("")),
  address: z.string().trim().optional().or(z.literal("")),
  openTime: z.string().trim().optional(),
  closeTime: z.string().trim().optional(),
  open: z.boolean().optional(),
});

export const reminderSchema = z.object({
  occasionName: z.string().trim().min(2, 'Enter an occasion name (e.g. "Priyanka\'s Birthday")'),
  recipientName: z.string().trim().min(2, "Enter a recipient name"),
  occasionType: z.string().trim().min(1),
  date: z.string().min(1, "Pick a date"),
  repeatYearly: z.boolean().optional(),
  remindMe: z.string().trim().min(1),
  giftCategory: z.string().trim().optional().or(z.literal("")),
  note: z.string().trim().max(250).optional().or(z.literal("")),
});

export const groupGiftContributorSchema = z.object({
  name: z.string().trim().min(1),
  amount: z.number().int().min(0),
  paid: z.boolean().optional(),
});

export const groupGiftSchema = z.object({
  title: z.string().trim().min(2),
  occasionType: z.string().trim().min(1),
  recipientName: z.string().trim().min(2, "Enter a recipient name"),
  deliveryCityId: z.string().min(1, "Pick a delivery city"),
  deliveryDate: z.string().min(1, "Pick a delivery date"),
  goalAmount: z.number().int().gt(0, "Enter a goal amount greater than 0"),
  splitType: z.enum(["equal", "custom"]),
  message: z.string().trim().max(250).optional().or(z.literal("")),
  productIds: z.array(z.string()).min(1),
  contributors: z.array(groupGiftContributorSchema).min(1),
});

export const contributePaymentSchema = z.object({
  paid: z.boolean(),
});
