import mongoose, { Schema, Document } from "mongoose";

export interface IPlace extends Document {
  index: number;
  storeName: string;
  placeId: string;
  address: string;
  category: string;
  phone?: string;
  googleUrl: string;
  bizWebsite?: string;
  ratingText?: string;
  stars?: number;
  numberOfReviews?: number;
  createdAt: Date;
}

const PlaceSchema: Schema = new Schema({
  index: { type: Number, required: true },
  storeName: { type: String, required: true },
  placeId: { type: String, required: true, unique: true },
  address: { type: String, required: true },
  category: { type: String, required: true },
  phone: String,
  googleUrl: { type: String, required: true },
  bizWebsite: String,
  ratingText: String,
  stars: Number,
  numberOfReviews: Number,
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model<IPlace>("Place", PlaceSchema);
