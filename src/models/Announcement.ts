import {
  InferSchemaType,
  Model,
  Schema,
  deleteModel,
  model,
  models,
} from "mongoose";

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
    hidden: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  },
);

export type AnnouncementDocument = InferSchemaType<
  typeof announcementSchema
>;

const cachedAnnouncementModel = models.Announcement as
  | Model<AnnouncementDocument>
  | undefined;

if (cachedAnnouncementModel && !cachedAnnouncementModel.schema.path("hidden")) {
  deleteModel("Announcement");
}

export const Announcement =
  (models.Announcement as Model<AnnouncementDocument>) ??
  model<AnnouncementDocument>("Announcement", announcementSchema);
