import { InferSchemaType, Model, Schema, model, models } from "mongoose";

const announcementSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    body: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000,
    },
    authorName: {
      type: String,
      required: true,
      trim: true,
    },
    authorId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

export type AnnouncementDocument = InferSchemaType<
  typeof announcementSchema
>;

export const Announcement =
  (models.Announcement as Model<AnnouncementDocument>) ??
  model<AnnouncementDocument>("Announcement", announcementSchema);
