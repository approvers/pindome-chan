export interface Attachment {
  id: Snowflake;
  filename: string;
  content_type?: string;
  size: number;
  url: string;
  proxy_url: string;
  height?: number;
  width?: number;
}

export interface PartialMessage {
  attachments: Attachment[];
  author: {
    avatar: string;
    discriminator: string;
    id: Snowflake;
    public_flags: number;
    username: string;
  };
  channel_id: Snowflake;
  components: unknown[];
  content: string;
  edited_timestamp: string | null;
  embeds: Embed[];
  flags: number;
  id: Snowflake;
  mention_everyone: boolean;
  mention_roles: Snowflake[];
  mentions: Snowflake[];
  pinned: boolean;
  timestamp: string;
  tts: boolean;
  type: 0;
}

export enum ApplicationCommandOptionType {
  SUB_COMMAND = 1,
  SUB_COMMAND_GROUP = 2,
  STRING = 3,
  INTEGER = 4,
  BOOLEAN = 5,
  USER = 6,
  CHANNEL = 7,
  ROLE = 8,
}

export interface ApplicationCommandOptionChoice {
  name: string;
  value: string | number;
}

export interface ApplicationCommandOption {
  type: ApplicationCommandOptionType;
  name: string;
  description: string;
  default?: boolean;
  required?: boolean;
  choices?: ApplicationCommandOptionChoice[];
  options?: ApplicationCommandOption[];
}

export interface ApplicationCommand {
  name: string;
  type: ApplicationCommandType;
  description?: string;
  options?: ApplicationCommandOption[];
}

export type Snowflake = string;

export enum InteractionType {
  Ping = 1,
  ApplicationCommand = 2,
  MessageComponent = 3,
}

export type OptionType = unknown;

export enum ApplicationCommandType {
  ChatInput = 1,
  User = 2,
  Message = 3,
}

export interface ResolvedData {
  messages?: Record<Snowflake, PartialMessage>;
}

export interface ApplicationCommandDataOption {
  name: string;
  value?: OptionType;
  options?: ApplicationCommandDataOption[];
}

export interface ApplicationCommandData {
  id: Snowflake;
  name: string;
  type: ApplicationCommandType;
  resolved?: ResolvedData;
  options?: ApplicationCommandDataOption[];
}

export interface GuildMember {
  deaf: boolean;
  is_pending: boolean;
  joined_at: string;
  mute: boolean;
  nick?: string;
  pending: boolean;
  permissions: string;
  premium_since?: string;
  roles: string[];
  user: {
    avatar?: string;
    discriminator: string;
    id: string;
    public_flags: number;
    username: string;
  };
}

export type Interaction = {
  id: Snowflake;
  guild_id: Snowflake;
  channel_id: Snowflake;
  member: GuildMember;
  token: string;
  version: number;
} & (
  | {
      type: InteractionType.Ping;
      data: undefined;
    }
  | {
      type: InteractionType.ApplicationCommand;
      data: ApplicationCommandData;
    }
);

export enum InteractionResponseType {
  Pong = 1,
  Acknowledge = 2,
  ChannelMessage = 3,
  ChannelMessageWithSource = 4,
  AcknowledgeWithSource = 5,
}

export enum AllowedMentionTypes {
  roles = "roles",
  users = "users",
  everyone = "everyone",
}

export interface AllowedMentions {
  parse?: AllowedMentionTypes[];
  roles?: Snowflake[];
  users?: Snowflake[];
  replied_user?: boolean;
}

export enum EmbedType {
  rich = "rich",
  image = "image",
  video = "video",
  gifv = "gifv",
  article = "article",
  link = "link",
}

export interface EmbedThumbnail {
  url?: string;
  proxy_url?: string;
  height?: number;
  width?: number;
}

export interface EmbedVideo {
  url?: string;
  height?: number;
  width?: number;
}

export interface EmbedImage {
  url?: string;
  proxy_url?: string;
  height?: number;
  width?: number;
}

export interface EmbedProvider {
  name?: string;
  url?: string;
}

export interface EmbedAuthor {
  name?: string;
  url?: string;
  icon_url?: string;
  proxy_icon_url?: string;
}

export interface EmbedFooter {
  text: string;
  icon_url?: string;
  proxy_icon_url?: string;
}

export interface EmbedField {
  name: string;
  value: string;
  inline?: boolean;
}

export interface Embed {
  title?: string;
  type?: EmbedType;
  description?: string;
  url?: string;
  timestamp?: string;
  color?: number;
  footer?: EmbedFooter;
  image?: EmbedImage;
  thumbnail?: EmbedThumbnail;
  video?: EmbedVideo;
  provider?: EmbedProvider;
  author?: EmbedAuthor;
  fields?: EmbedField[];
}

export interface InteractionApplicationCommandCallbackData {
  tts?: boolean;
  content: string;
  embeds?: Embed[];
  allowed_mentions?: AllowedMentions;
}

export interface InteractionResponse {
  type: InteractionResponseType;
  data?: InteractionApplicationCommandCallbackData;
}

export type InteractionHandler = (
  interaction: Interaction,
) => Promise<InteractionResponse> | InteractionResponse;
