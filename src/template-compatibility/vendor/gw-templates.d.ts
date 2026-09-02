declare module "@buildwars/gw-templates" {
  export class SkillTemplate {
    public static fromTemplate(code: string): unknown;
    public static fromChatCode(code: string): unknown;
    public decode(code: string): unknown;
    public encode(
      primaryProfessionId: number,
      secondaryProfessionId: number,
      attributes: Record<string, number>,
      skillIds: readonly number[]
    ): string;
  }

  export class EquipmentTemplate {
    public static fromTemplate(code: string): unknown;
    public static fromChatCode(code: string): unknown;
    public decode(code: string): unknown;
    public addItem(itemId: number, colorId: number, modifierIds: readonly number[]): void;
    public encode(): string;
  }

  export class PwndTemplate {
    public static readonly PAWNED_CHARSET_WINDOWS1252: number;
    public static readonly PAWNED_CHARSET_UTF8: number;
    public static fromTemplate(code: string): unknown;
    public constructor(charset?: number);
    public decode(code: string): unknown;
    public addBuild(
      skillCode: string,
      equipmentCode: string,
      weaponSetCodes: readonly string[],
      templateName: string,
      description: string,
      player: string,
      attributes: readonly number[],
      flags: readonly boolean[]
    ): void;
    public encode(): string;
  }

  const templates: {
    readonly SkillTemplate: typeof SkillTemplate;
    readonly EquipmentTemplate: typeof EquipmentTemplate;
    readonly PwndTemplate: typeof PwndTemplate;
  };

  export default templates;
}
