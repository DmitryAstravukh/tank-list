import { z } from "zod";

/**
 * Схема валидации изображений танка.
 * Три URL-ссылки на иконки разных размеров: маленькая, контурная, большая.
 *
 * @see {@link TankSchema} — использует эту схему в поле `images`
 */
const ImagesSchema = z.object({
  small_icon: z.string().url(),
  contour_icon: z.string().url(),
  big_icon: z.string().url(),
});

/**
 * Схема валидации члена экипажа.
 * Словарь ролей и уникальный идентификатор члена экипажа.
 *
 * @see {@link TankSchema} — использует эту схему в поле `crew`
 */
const CrewMemberSchema = z.object({
  roles: z.record(z.string(), z.string()),
  member_id: z.string(),
});

/**
 * Перечисление типов модулей танка.
 * Допустимые значения: ходовая, башня, орудие, двигатель, радиостанция.
 *
 * @see {@link ModuleTreeNodeSchema} — использует этот enum в поле `type`
 */
const ModuleTypeSchema = z.enum([
  "vehicleChassis",
  "vehicleTurret",
  "vehicleGun",
  "vehicleEngine",
  "vehicleRadio",
]);

/**
 * Схема валидации узла дерева исследования модулей.
 * Имя модуля, связи с другими модулями и танками, стоимость, тип.
 *
 * @see {@link ModuleTypeSchema} — перечисление типов модуля
 * @see {@link TankSchema} — использует эту схему в поле `modules_tree`
 */
const ModuleTreeNodeSchema = z.object({
  name: z.string(),
  next_modules: z.array(z.number()).nullable(),
  next_tanks: z.array(z.number()).nullable(),
  is_default: z.boolean(),
  price_xp: z.number(),
  price_credit: z.number(),
  module_id: z.number(),
  type: ModuleTypeSchema,
});

/**
 * Схема валидации характеристик двигателя.
 * Мощность, вес, шанс возгорания, уровень модуля.
 *
 * @see {@link DefaultProfileSchema} — использует эту схему в поле `engine`
 */
const EngineSchema = z.object({
  name: z.string(),
  power: z.number(),
  weight: z.number(),
  tag: z.string(),
  fire_chance: z.number(),
  tier: z.number(),
});

/**
 * Схема валидации характеристик ходовой части.
 * Грузоподъёмность, скорость поворота, угол блокировки руля, уровень.
 *
 * @see {@link DefaultProfileSchema} — использует эту схему в поле `suspension`
 */
const SuspensionSchema = z.object({
  name: z.string(),
  weight: z.number(),
  load_limit: z.number(),
  tag: z.string(),
  traverse_speed: z.number(),
  tier: z.number(),
  steering_lock_angle: z.number(),
});

/**
 * Схема валидации стороны бронирования.
 * Толщина брони в мм: лоб, борта, корма.
 *
 * @see {@link ArmorSchema} — использует эту схему для `hull` и `turret`
 */
const ArmorSideSchema = z.object({
  front: z.number(),
  sides: z.number(),
  rear: z.number(),
});

/**
 * Схема валидации полного бронирования танка.
 * Объединяет бронирование башни и корпуса.
 *
 * @see {@link ArmorSideSchema} — схема отдельной стороны
 * @see {@link DefaultProfileSchema} — использует эту схему в поле `armor`
 */
const ArmorSchema = z.object({
  turret: ArmorSideSchema,
  hull: ArmorSideSchema,
});

/**
 * Схема валидации установленных модулей.
 * Идентификаторы активных орудия, ходовой, башни, радиостанции, двигателя.
 *
 * @see {@link DefaultProfileSchema} — использует эту схему в поле `modules`
 */
const ModulesSchema = z.object({
  gun_id: z.number(),
  suspension_id: z.number(),
  turret_id: z.number(),
  radio_id: z.number(),
  engine_id: z.number(),
});

/**
 * Схема валидации характеристик орудия.
 * Калибр, разброс, время сведения, скорострельность, углы вертикальной наводки.
 *
 * @see {@link DefaultProfileSchema} — использует эту схему в поле `gun`
 */
const GunSchema = z.object({
  heavy_flame_thrower_ttc: z.unknown().nullable(),
  move_down_arc: z.number(),
  caliber: z.number(),
  name: z.string(),
  weight: z.number(),
  move_up_arc: z.number(),
  fire_rate: z.number(),
  dispersion: z.number(),
  tag: z.string(),
  traverse_speed: z.number(),
  reload_time: z.number(),
  tier: z.number(),
  aim_time: z.number(),
});

/**
 * Схема валидации характеристик башни.
 * Обзор, прочность, скорость и углы поворота, уровень.
 *
 * @see {@link DefaultProfileSchema} — использует эту схему в поле `turret`
 */
const TurretSchema = z.object({
  name: z.string(),
  weight: z.number(),
  view_range: z.number(),
  hp: z.number(),
  tag: z.string(),
  traverse_speed: z.number(),
  traverse_right_arc: z.number(),
  tier: z.number(),
  traverse_left_arc: z.number(),
});

/**
 * Схема валидации характеристик радиостанции.
 * Дальность связи, вес, уровень модуля.
 *
 * @see {@link DefaultProfileSchema} — использует эту схему в поле `radio`
 */
const RadioSchema = z.object({
  tier: z.number(),
  signal_range: z.number(),
  tag: z.string(),
  name: z.string(),
  weight: z.number(),
});

/**
 * Перечисление типов боеприпасов.
 * Допустимые значения: бронебойный, кумулятивный, осколочно-фугасный.
 *
 * @see {@link AmmoSchema} — использует этот enum в поле `type`
 */
const AmmoTypeSchema = z.enum(["ARMOR_PIERCING", "HOLLOW_CHARGE", "HIGH_EXPLOSIVE"]);

/**
 * Схема валидации характеристик снаряда.
 * Пробитие и урон (мин/ном/макс), тип снаряда, данные об оглушении.
 *
 * @see {@link AmmoTypeSchema} — перечисление типов снарядов
 * @see {@link DefaultProfileSchema} — использует эту схему в поле `ammo`
 */
const AmmoSchema = z.object({
  penetration: z.tuple([z.number(), z.number(), z.number()]),
  stun: z.unknown().nullable(),
  type: AmmoTypeSchema,
  damage: z.tuple([z.number(), z.number(), z.number()]),
});

/**
 * Схема валидации базовой комплектации танка.
 * Все модули, бронирование, скорости, прочность, боекомплект, спецрежимы.
 *
 * @see {@link EngineSchema} — схема двигателя
 * @see {@link SuspensionSchema} — схема ходовой
 * @see {@link ArmorSchema} — схема бронирования
 * @see {@link GunSchema} — схема орудия
 * @see {@link TurretSchema} — схема башни
 * @see {@link RadioSchema} — схема радиостанции
 * @see {@link AmmoSchema} — схема снарядов
 * @see {@link ModulesSchema} — схема установленных модулей
 * @see {@link TankSchema} — использует эту схему в поле `default_profile`
 */
const DefaultProfileSchema = z.object({
  engine: EngineSchema,
  siege: z.unknown().nullable(),
  max_ammo: z.number(),
  suspension: SuspensionSchema,
  weight: z.number(),
  armor: ArmorSchema,
  hp: z.number(),
  modules: ModulesSchema,
  gun: GunSchema,
  turret: TurretSchema,
  hull_weight: z.number(),
  radio: RadioSchema,
  rapid: z.unknown().nullable(),
  speed_forward: z.number(),
  hull_hp: z.number(),
  thermal_vision: z.unknown().nullable(),
  speed_backward: z.number(),
  ammo: z.array(AmmoSchema),
  max_weight: z.number(),
});

/**
 * Перечисление классов боевой техники.
 * Допустимые значения: средний танк, тяжёлый, лёгкий, ПТ-САУ, САУ.
 *
 * @see {@link TankSchema} — использует этот enum в поле `type`
 */
const TankTypeSchema = z.enum(["mediumTank", "heavyTank", "lightTank", "AT-SPG", "SPG"]);

/**
 * Центральный список Zod-валидаторов для всех полей танка.
 * Единый источник истины для построения полных и частичных схем.
 *
 * @internal Используется для динамического построения схем через {@link pickTankSchema}
 * @see {@link TankField} — тип ключей этого объекта
 * @see {@link TankSchema} — оборачивает этот объект в полноценную схему
 */
export const tankSchemaObj = {
  is_wheeled: z.boolean(),
  radios: z.array(z.number()),
  is_premium: z.boolean(),
  tag: z.string(),
  images: ImagesSchema,
  tank_id: z.number(),
  suspensions: z.array(z.number()),
  provisions: z.array(z.number()),
  engines: z.array(z.number()),
  crew: z.array(CrewMemberSchema),
  type: TankTypeSchema,
  guns: z.array(z.number()),
  multination: z.unknown().nullable(),
  description: z.string(),
  short_name: z.string(),
  is_premium_igr: z.boolean(),
  next_tanks: z.record(z.string(), z.number()),
  modules_tree: z.record(z.string(), ModuleTreeNodeSchema),
  nation: z.string(),
  tier: z.number(),
  prices_xp: z.record(z.string(), z.number()),
  is_gift: z.boolean(),
  name: z.string(),
  price_gold: z.number(),
  price_credit: z.number(),
  default_profile: DefaultProfileSchema,
  turrets: z.array(z.number()),
} satisfies Record<string, z.ZodTypeAny>;

/**
 * Полная схема валидации танка.
 * Объединяет все поля {@link tankSchemaObj} в единый Zod-объект.
 *
 * @see {@link Tank} — TypeScript-тип, выведенный из этой схемы
 * @see {@link pickTankSchema} — создаёт подсхему с выбранными полями
 */
export const TankSchema = z.object(tankSchemaObj);
