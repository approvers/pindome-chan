import { pinMessage, type WebhookOptions } from "./commands/pin_message.ts";
import {
  ApplicationCommandType,
  type Interaction,
  type InteractionHandlers,
  type InteractionResponse,
  InteractionResponseType,
  InteractionType,
} from "./types.ts";

const errorResponse = (reason: string) => ({
  type: InteractionResponseType.ChannelMessageWithSource,
  data: {
    content: `${reason}、ピン留めできないみたいです…`,
  },
});

export const makeCommands = (options: WebhookOptions): InteractionHandlers => [
  [
    {
      type: ApplicationCommandType.Message,
      name: "ピン留め",
    },
    async (interaction: Interaction): Promise<InteractionResponse> => {
      if (interaction.type !== InteractionType.ApplicationCommand) {
        return errorResponse("コマンドの種類が違うから");
      }
      const messages = interaction.data.resolved?.messages;
      if (messages === undefined) {
        return errorResponse("間に合わなかったから");
      }
      const [message] = Object.values(messages);
      const content = await pinMessage(message, interaction, options);

      return {
        type: InteractionResponseType.ChannelMessageWithSource,
        data: {
          content,
        },
      };
    },
  ],
];
