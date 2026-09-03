import type { CatalogProfessionRecord, CatalogSkillRecord } from "../domain";
import type { SkillFactIconKind } from "./skill-icons";

import generatedSkillIconManifestJson from "./skill-icon-assets.generated.json";
import divineBoonIconUrl from "./assets/gww-icons/divine-boon.jpg";
import hammerBashIconUrl from "./assets/gww-icons/hammer-bash.jpg";
import healingSignetIconUrl from "./assets/gww-icons/healing-signet.jpg";
import huntersShotIconUrl from "./assets/gww-icons/hunters-shot.jpg";
import mightyBlowIconUrl from "./assets/gww-icons/mighty-blow.jpg";
import pinDownIconUrl from "./assets/gww-icons/pin-down.jpg";
import professionAssassinIcon20Url from "./assets/gww-icons/profession-assassin-20.png";
import professionAssassinIcon60Url from "./assets/gww-icons/profession-assassin-60.png";
import professionDervishIcon20Url from "./assets/gww-icons/profession-dervish-20.png";
import professionDervishIcon60Url from "./assets/gww-icons/profession-dervish-60.png";
import professionElementalistIcon20Url from "./assets/gww-icons/profession-elementalist-20.png";
import professionElementalistIcon60Url from "./assets/gww-icons/profession-elementalist-60.png";
import professionMesmerIcon20Url from "./assets/gww-icons/profession-mesmer-20.png";
import professionMesmerIcon60Url from "./assets/gww-icons/profession-mesmer-60.png";
import professionMonkIcon20Url from "./assets/gww-icons/profession-monk-20.png";
import professionMonkIcon60Url from "./assets/gww-icons/profession-monk-60.png";
import professionNecromancerIcon20Url from "./assets/gww-icons/profession-necromancer-20.png";
import professionNecromancerIcon60Url from "./assets/gww-icons/profession-necromancer-60.png";
import professionParagonIcon20Url from "./assets/gww-icons/profession-paragon-20.png";
import professionParagonIcon60Url from "./assets/gww-icons/profession-paragon-60.png";
import professionRangerIcon20Url from "./assets/gww-icons/profession-ranger-20.png";
import professionRangerIcon60Url from "./assets/gww-icons/profession-ranger-60.png";
import professionRitualistIcon20Url from "./assets/gww-icons/profession-ritualist-20.png";
import professionRitualistIcon60Url from "./assets/gww-icons/profession-ritualist-60.png";
import professionWarriorIcon20Url from "./assets/gww-icons/profession-warrior-20.png";
import professionWarriorIcon60Url from "./assets/gww-icons/profession-warrior-60.png";
import resurrectionSignetIconUrl from "./assets/gww-icons/resurrection-signet.jpg";
import rushIconUrl from "./assets/gww-icons/rush.jpg";
import tangoActivationUrl from "./assets/gww-icons/tango-activation-darker.png";
import tangoAdrenalineUrl from "./assets/gww-icons/tango-adrenaline.png";
import tangoEnergyUrl from "./assets/gww-icons/tango-energy.png";
import tangoOvercastUrl from "./assets/gww-icons/tango-overcast.png";
import tangoRechargeUrl from "./assets/gww-icons/tango-recharge-darker.png";
import tangoSacrificeUrl from "./assets/gww-icons/tango-sacrifice.png";
import tangoUpkeepUrl from "./assets/gww-icons/tango-upkeep.png";
import toTheLimitIconUrl from "./assets/gww-icons/to-the-limit.jpg";

export interface LocalIconAsset {
  readonly src: string;
  readonly label: string;
  readonly width: number;
  readonly height: number;
  readonly compact?: {
    readonly src: string;
    readonly width: number;
    readonly height: number;
  };
}

interface GeneratedSkillIconEntry {
  readonly src: string;
  readonly label: string;
  readonly width: number;
  readonly height: number;
}

interface GeneratedSkillIconManifest {
  readonly assetsBySkillId: Readonly<Record<string, GeneratedSkillIconEntry | undefined>>;
}

const GENERATED_SKILL_ICON_MANIFEST = generatedSkillIconManifestJson as GeneratedSkillIconManifest;

export const LOCAL_FACT_ICON_ASSETS: Readonly<Record<SkillFactIconKind, LocalIconAsset | null>> = {
  adrenaline: {
    src: tangoAdrenalineUrl,
    label: "Adrenaline icon",
    width: 20,
    height: 20
  },
  energy: {
    src: tangoEnergyUrl,
    label: "Energy icon",
    width: 20,
    height: 20
  },
  sacrifice: {
    src: tangoSacrificeUrl,
    label: "Sacrifice icon",
    width: 20,
    height: 20
  },
  upkeep: {
    src: tangoUpkeepUrl,
    label: "Upkeep icon",
    width: 20,
    height: 20
  },
  overcast: {
    src: tangoOvercastUrl,
    label: "Overcast icon",
    width: 20,
    height: 20
  },
  activation: {
    src: tangoActivationUrl,
    label: "Activation time icon",
    width: 20,
    height: 20
  },
  recharge: {
    src: tangoRechargeUrl,
    label: "Recharge time icon",
    width: 20,
    height: 20
  },
  "morale-recharge": {
    src: tangoRechargeUrl,
    label: "Morale recharge icon",
    width: 20,
    height: 20
  },
  title: null,
  fact: null
};

const LOCAL_SKILL_ICON_ASSETS_BY_NAME: Readonly<Partial<Record<string, LocalIconAsset>>> = {
  "divine boon": {
    src: divineBoonIconUrl,
    label: "Divine Boon icon",
    width: 64,
    height: 64
  }
};

const LOCAL_SKILL_ICON_ASSETS_BY_ID: Readonly<Partial<Record<number, LocalIconAsset>>> = {
  1: {
    src: healingSignetIconUrl,
    label: "Healing Signet icon",
    width: 64,
    height: 64
  },
  2: {
    src: resurrectionSignetIconUrl,
    label: "Resurrection Signet icon",
    width: 64,
    height: 64
  },
  284: LOCAL_SKILL_ICON_ASSETS_BY_NAME["divine boon"]!,
  316: {
    src: toTheLimitIconUrl,
    label: '"To the Limit!" icon',
    width: 64,
    height: 64
  },
  319: {
    src: rushIconUrl,
    label: "Rush icon",
    width: 64,
    height: 64
  },
  331: {
    src: hammerBashIconUrl,
    label: "Hammer Bash icon",
    width: 64,
    height: 64
  },
  351: {
    src: mightyBlowIconUrl,
    label: "Mighty Blow icon",
    width: 64,
    height: 64
  },
  391: {
    src: huntersShotIconUrl,
    label: "Hunter's Shot icon",
    width: 64,
    height: 64
  },
  392: {
    src: pinDownIconUrl,
    label: "Pin Down icon",
    width: 64,
    height: 64
  }
};

const LOCAL_SKILL_ICON_ASSETS_BY_MEDIA_ID: Readonly<Partial<Record<string, LocalIconAsset>>> = {
  "remote-media:gww-icon:resurrection-signet": LOCAL_SKILL_ICON_ASSETS_BY_ID[2]!
};

const LOCAL_PROFESSION_ICON_ASSETS_BY_ID: Readonly<Partial<Record<number, LocalIconAsset>>> = {
  1: professionIcon("Warrior", professionWarriorIcon60Url, professionWarriorIcon20Url),
  2: professionIcon("Ranger", professionRangerIcon60Url, professionRangerIcon20Url),
  3: professionIcon("Monk", professionMonkIcon60Url, professionMonkIcon20Url),
  4: professionIcon("Necromancer", professionNecromancerIcon60Url, professionNecromancerIcon20Url),
  5: professionIcon("Mesmer", professionMesmerIcon60Url, professionMesmerIcon20Url),
  6: professionIcon(
    "Elementalist",
    professionElementalistIcon60Url,
    professionElementalistIcon20Url
  ),
  7: professionIcon("Assassin", professionAssassinIcon60Url, professionAssassinIcon20Url),
  8: professionIcon("Ritualist", professionRitualistIcon60Url, professionRitualistIcon20Url),
  9: professionIcon("Paragon", professionParagonIcon60Url, professionParagonIcon20Url),
  10: professionIcon("Dervish", professionDervishIcon60Url, professionDervishIcon20Url)
};

const LOCAL_PROFESSION_ICON_ASSETS_BY_MEDIA_ID: Readonly<Partial<Record<string, LocalIconAsset>>> =
  {
    "remote-media:gww-icon:warrior": LOCAL_PROFESSION_ICON_ASSETS_BY_ID[1]!,
    "remote-media:gww-icon:ranger": LOCAL_PROFESSION_ICON_ASSETS_BY_ID[2]!,
    "remote-media:gww-icon:monk": LOCAL_PROFESSION_ICON_ASSETS_BY_ID[3]!,
    "remote-media:gww-icon:necromancer": LOCAL_PROFESSION_ICON_ASSETS_BY_ID[4]!,
    "remote-media:gww-icon:mesmer": LOCAL_PROFESSION_ICON_ASSETS_BY_ID[5]!,
    "remote-media:gww-icon:elementalist": LOCAL_PROFESSION_ICON_ASSETS_BY_ID[6]!,
    "remote-media:gww-icon:assassin": LOCAL_PROFESSION_ICON_ASSETS_BY_ID[7]!,
    "remote-media:gww-icon:ritualist": LOCAL_PROFESSION_ICON_ASSETS_BY_ID[8]!,
    "remote-media:gww-icon:paragon": LOCAL_PROFESSION_ICON_ASSETS_BY_ID[9]!,
    "remote-media:gww-icon:dervish": LOCAL_PROFESSION_ICON_ASSETS_BY_ID[10]!
  };

export function localSkillIconAsset(skill: CatalogSkillRecord | null): LocalIconAsset | null {
  if (skill === null) {
    return null;
  }
  const generated = generatedSkillIconAsset(skill);
  return (
    generated ??
    LOCAL_SKILL_ICON_ASSETS_BY_ID[Number(skill.id)] ??
    (skill.iconId === null ? null : LOCAL_SKILL_ICON_ASSETS_BY_MEDIA_ID[skill.iconId]) ??
    LOCAL_SKILL_ICON_ASSETS_BY_NAME[normalizeAssetKey(skill.name)] ??
    null
  );
}

export function localProfessionIconAsset(
  profession: CatalogProfessionRecord | null
): LocalIconAsset | null {
  if (profession === null) {
    return null;
  }
  return (
    LOCAL_PROFESSION_ICON_ASSETS_BY_ID[Number(profession.id)] ??
    (profession.iconId === null
      ? null
      : LOCAL_PROFESSION_ICON_ASSETS_BY_MEDIA_ID[profession.iconId]) ??
    null
  );
}

function professionIcon(name: string, src: string, compactSrc: string): LocalIconAsset {
  return {
    src,
    label: `${name} icon`,
    width: 60,
    height: 60,
    compact: {
      src: compactSrc,
      width: 20,
      height: 20
    }
  };
}

function generatedSkillIconAsset(skill: CatalogSkillRecord): LocalIconAsset | null {
  const entry = GENERATED_SKILL_ICON_MANIFEST.assetsBySkillId[String(skill.id)];
  if (entry === undefined || /^https?:\/\//i.test(entry.src)) {
    return null;
  }
  return {
    src: publicAssetPath(entry.src),
    label: entry.label,
    width: entry.width,
    height: entry.height
  };
}

function publicAssetPath(src: string): string {
  const base = import.meta.env.BASE_URL || "/";
  const normalizedBase = base.endsWith("/") ? base : `${base}/`;
  return `${normalizedBase}${src.replace(/^\/+/, "")}`;
}

function normalizeAssetKey(value: string): string {
  return value.trim().replace(/\s+/g, " ").toLocaleLowerCase("en-US");
}
