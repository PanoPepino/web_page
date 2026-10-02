import content from "@/data/outreach-content.json";
import { publicUrl } from "@/lib/site-url";

export type HistoryEntry = { text: string; image: string | null; side: "left" | "right" | null };
export type PostcardCopy = { title: string; image: string; bullets: string[] };
export type PostcardSource = { eng: PostcardCopy; esp: PostcardCopy };

export const outreachContent = content;
export const postcardKeys = ["1_cosmology", "2_eft", "3_st", "4_landscape", "5_swamp", "6_db"] as const;
export const postcardImages = postcardKeys.map(key => publicUrl(`assets/outreach/${outreachContent[key].eng.image}`));
export const imageByName: Record<string, string> = {
  "einstein.jpeg": publicUrl("/assets/outreach/einstein.jpeg"),
  "kaluza.jpg": publicUrl("/assets/outreach/kaluza.jpg"),
  "curtis.jpg": publicUrl("/assets/outreach/curtis.jpg"),
  "hubble.jpg": publicUrl("/assets/outreach/hubble.jpg"),
  "lemaitre.jpg": publicUrl("/assets/outreach/lemaitre.jpg"),
  "alpha.png": publicUrl("/assets/outreach/alpha.png"),
  "wilson.jpg": publicUrl("/assets/outreach/wilson.jpg"),
  "hawking.jpg": publicUrl("/assets/outreach/hawking.jpg"),
  "witten.jpg": publicUrl("/assets/outreach/witten.jpg"),
  "peebles.jpg": publicUrl("/assets/outreach/peebles.jpg"),
};
