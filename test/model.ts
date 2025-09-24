import * as z from 'zod';

export const Chicken = z.object({
  identifier: z.string(),
  type: z.string(),
  name: z.string()
});
export type Chicken = z.infer<typeof Chicken>

export const ChickenCollection = z.array(Chicken);
export type ChickenCollection = z.infer<typeof ChickenCollection>

export const ChickenCreateRequest = z.object({
  type: z.string(),
  name: z.string()
});

export type ChickenCreateRequest = z.infer<typeof ChickenCreateRequest>

export const OtherRequest = z.object({
  item: z.union([Chicken, ChickenCollection])
});

export type OtherRequest = z.infer<typeof OtherRequest>
