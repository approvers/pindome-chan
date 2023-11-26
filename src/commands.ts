import { pinMessage, WebhookOptions } from "./commands/pin_message.ts";
import {
  ApplicationCommandType,
  Interaction,
  InteractionHandlers,
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
    (interaction: Interaction) => {
      if (interaction.type !== InteractionType.ApplicationCommand) {
        return errorResponse("コマンドの種類が違うから");
      }
      const messages = interaction.data.resolved?.messages;
      if (messages === undefined) {
        return errorResponse("間に合わなかったから");
      }
      const [message] = Object.values(messages);
      void pinMessage(message, interaction, options);

      return {
        type: InteractionResponseType.DeferredChannelMessageWithSource,
        data: {
          content: "ピン留め中…",
        },
      };
    },
  ],
];
