export {
  EQUIPMENT_TEMPLATE_PACKAGE_EXAMPLE,
  GW_TEMPLATES_PACKAGE_VERSION,
  SKILL_TEMPLATE_PACKAGE_EXAMPLE
} from "./gw-templates-adapter";
export {
  TEMPLATE_BARE_CODE_CHAR_LIMIT,
  TEMPLATE_INPUT_CHAR_LIMIT,
  TEMPLATE_NAME_CODE_POINT_LIMIT,
  formatTemplateChatCode,
  inferTemplateKindFromBareCode,
  parseTemplateInput,
  validateTemplateName,
  type ParsedTemplateInput
} from "./chat-code";
export {
  decodeSkillTemplate,
  exportSkillTemplate,
  resolveSkillTemplateDocument,
  skillTemplateFingerprint
} from "./skill-template";
export {
  decodeEquipmentTemplate,
  equipmentTemplateFingerprint,
  exportEquipmentTemplate
} from "./equipment-template";
