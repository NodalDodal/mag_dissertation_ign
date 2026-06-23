/**
 * Документация взята с:
 * https://yandex.ru/support/metrica/ru/objects/method-reference
 *
 * Инициализация счётчика:
 * https://yandex.ru/support/metrica/ru/code/counter-initialize
 */

declare global {
  interface Window {
    ym: YandexMetrica
  }
}

/**
 * Интерфейс функции трекера Яндекс.Метрики
 */
export interface YandexMetrica {
  /**
   * Инициализация счётчика в index.html
   * @param counterId - ID счетчика
   * @param action - Всегда 'init'
   * @param config - Объект конфигурации
   */
  (
    counterId: number | string,
    action: 'init',
    config?: YandexMetricaConfig,
  ): void

  /**
   * Отслеживание загрузки файлов с заданными расширениями.
   * @param counterId - ID счетчика
   * @param action - Всегда 'addFileExtension'
   * @param extensions - Расширение имени файла, заданное в виде строки или список расширений, указанный в виде массива строк
   */
  (
    counterId: number | string,
    action: 'addFileExtension',
    extensions:
      | YandexMetrikaSupportedFileExtension
      | YandexMetrikaSupportedFileExtension[],
  ): void

  /**
   * Отправка информации о переходе по внешней ссылке.
   * Собранные данные используются при формировании Карты ссылок и отчета Внешние переходы.
   * @param counterId - ID счетчика
   * @param action - Всегда 'extLink'
   * @param url - URL страницы, на которую произошел переход
   * @param options - Необязательные параметры
   */
  (
    counterId: number | string,
    action: 'extLink',
    url: string,
    options?: YandexMetricaOptions,
  ): void

  /**
   * Отправка информации о загрузке файла.
   * Собранные данные используются при формировании отчета Загрузки файлов.
   * @param counterId - ID счетчика
   * @param action - Всегда 'file'
   * @param url - URL страницы, на которую произошел переход
   * @param options - Необязательные параметры
   */
  (
    counterId: number | string,
    action: 'file',
    url: string,
    options?: YandexMetricaOptions,
  ): void

  /**
   * Метод доступен для сайтов, которые работают на протоколе HTTPS.
   *
   * Отправка информации о посетителях сайта для улучшения работы рекламных алгоритмов и более точного анализа их поведения на сайте. Это поможет вам повышать эффективность рекламных кампаний и узнавать больше о поведении посетителей, даже если они используют браузеры с ограничением межсайтовых отслеживающих cookies (third-party cookies) — например, Safari или Mozilla Firefox.
   *
   * После первой передачи данных с помощью метода в Метрике появится цель Заполнение контактных данных — для этого включите опцию Автоматические цели.
   *
   * @param counterId - ID счетчика
   * @param action - Всегда 'firstPartyParams'
   * @param parameters - Информация о посетителе, которую он оставил на сайте, например через форму обратной связи
   */
  (
    counterId: number | string,
    action: 'firstPartyParams',
    parameters: YandexMetricaFirstPartyParams,
  ): void

  /**
   * Метод доступен для сайтов, которые работают на протоколе HTTPS.
   *
   * Отправка информации о посетителях сайта для улучшения работы рекламных алгоритмов и более точного анализа их поведения на сайте. Это поможет вам повышать эффективность рекламных кампаний и узнавать больше о поведении посетителей, даже если они используют браузеры с ограничением межсайтовых отслеживающих cookies (third-party cookies) — например, Safari или Mozilla Firefox.
   * После первой передачи данных с помощью метода в Метрике появится цель Заполнение контактных данных — для этого включите опцию Автоматические цели.
   *
   * @param counterId - ID счетчика
   * @param action - Всегда 'firstPartyParamsHashed'
   * @param parameters - Информация о посетителе, которую он оставил на сайте, например через форму обратной связи
   */
  (
    counterId: number | string,
    action: 'firstPartyParamsHashed',
    parameters: YandexMetricaFirstPartyParamsHashed,
  ): void

  /**
   * Получение идентификатора посетителя сайта, заданного Яндекс Метрикой.
   * @param counterId - ID счетчика
   * @param action - Всегда 'getClientID'
   * @param callback - Функция, которая будет вызвана после получения идентификатора
   */
  (
    counterId: number | string,
    action: 'getClientID',
    callback: (clientId: string) => void,
  ): void

  /**
   * Отправка данных о просмотре. Обычно используется на страницах, реализованных с использованием AJAX или и Flash.
   * @param counterId - ID счетчика
   * @param action - Всегда 'hit'
   * @param url - URL страницы, с которой совершен просмотр. Если URL не передан, будет использовано значение из window.location.href
   * @param options
   */
  (
    counterId: number | string,
    action: 'hit',
    url: string,
    options?: YandexMetricaOptions & {
      // URL с которого посетитель загрузил содержимое текущей страницы
      referrer?: string
    },
  ): void

  /**
   * Передача информации о том, что визит пользователя не является отказом.
   * @param counterId - ID счетчика
   * @param action - Всегда 'notBounce'
   * @param options
   */
  (
    counterId: number | string,
    action: 'notBounce',
    options?: Pick<YandexMetricaOptions, 'callback' | 'ctx'>,
  ): void

  /**
   * Передача произвольных параметров визита.
   *
   * Часть названий полей зарезервирована для передачи данных электронной коммерции. Не используйте эти названия для передачи параметров визитов. Не передавайте свои параметры с зарезервированными.
   *
   * @param counterId - ID счетчика
   * @param action - Всегда 'params'
   * @param parameters
   */
  (
    counterId: number | string,
    action: 'params',
    parameters: Record<string, unknown> | unknown[],
  ): void

  /**
   * Передача информации о достижении цели.
   * @param counterId - ID счетчика
   * @param action - Всегда 'reachGoal'
   * @param target - Идентификатор цели. Задается на странице редактирования счетчика при создании или изменении цели типа «JavaScript-событие»
   * @param params - Параметры визита
   * @param callback - Callback-функция, вызываемая после отправки данных о просмотре
   * @param ctx - Контекст выполнения
   */
  (
    counterId: number | string,
    action: 'reachGoal',
    target: string,
    params?: Record<string, unknown>,
    callback?: () => void,
    ctx?: Record<string, unknown>,
  ): void

  /**
   * Установить уникальный ID пользователя
   * @param counterId - ID счетчика
   * @param action - Всегда 'setUserID'
   * @param userId - Уникальный идентификатор пользователя
   */
  (counterId: number | string, action: 'setUserID', userId: string): void

  /**
   * Отправить параметры пользователя
   * @param counterId - ID счетчика
   * @param action - Всегда 'userParams'
   * @param params - Объект параметров пользователя
   */
  (
    counterId: number | string,
    action: 'userParams',
    params: Record<string, unknown> & {
      UserID?: string | number
    },
  ): void
}

/**
 * Конфигурация инициализации Яндекс.Метрики
 */
export interface YandexMetricaConfig {
  /**
   * Точный показатель отказов. Параметр может принимать значения:
   *
   * true — включить точный показатель отказов, событие о неотказе засчитывается через 15000 мс (15 с);
   *
   * false — не включать точный показатель отказов;
   *
   * <N> (целое число) — включить точный показатель отказов, событие о неотказе засчитывается через <N> мс
   */
  accurateTrackBounce?: boolean | number

  /**
   * Признак записи содержимого iframe без счетчика в дочернем окне
   */
  childIframe?: boolean

  /**
   * Признак сбора данных для карты кликов
   */
  clickmap?: boolean

  /**
   * Признак отключения автоматической отправки данных при инициализации счетчика
   */
  defer?: boolean

  /**
   * Сбор данных электронной коммерции.
   *
   * true — включить сбор данных электронной коммерции. Равносильно значению dataLayer;
   *
   * false — отключить сбор данных электронной коммерции Ecommerce;
   *
   * <objectName> (String) — включить сбор данных электронной коммерции. Передача данных производится через JavaScript-массив с именем <objectName>;
   *
   * <array> (Array) — включить сбор данных электронной коммерции. Передача данных производится через JavaScript-массив <array>
   */
  ecommerce?: boolean | string | unknown[]

  /**
   * Параметры визита, передаваемые во время инициализации счетчика
   */
  params?: Record<string, unknown> | unknown[]

  /**
   * Параметры посетителей сайта, передаваемые во время инициализации счетчика
   */
  userParams?: Record<string, unknown>

  /**
   * Признак отслеживания изменений хеша в адресной строке браузера
   */
  trackHash?: boolean

  /**
   * Признак отслеживания переходов по внешним ссылкам
   */
  trackLinks?: boolean

  /**
   * Признак доверенного домена для записи содержимого дочернего окна iframe
   */
  trustedDomains?: string[]

  /**
   * Тип счетчика. Для РСЯ равен 1
   */
  type?: number

  /**
   * Признак использования Вебвизора
   */
  webvisor?: boolean

  /**
   * Признак проверки готовности счетчика
   */
  triggerEvent?: boolean

  /**
   * Запись заголовков. Если в заголовках есть приватные данные, при инициализации счетчика укажите значение false
   */
  sendTitle?: boolean

  /**
   * Технический параметр для работы кода вставки
   */
  ssr?: boolean
}

/**
 * Параметры Яндекс.Метрики для переходов и целей
 */
export interface YandexMetricaParams {
  /**
   * Заголовок страницы
   */
  title?: string

  /**
   * URL реферера
   */
  referrer?: string

  /**
   * Параметры для отправки с переходом/целью
   */
  params?: Record<string, unknown>

  /**
   * Параметры пользователя
   */
  userParams?: Record<string, unknown>

  /**
   * Отправлять ли данные через History API
   */
  history?: boolean

  /**
   * Функция обратного вызова при отправке перехода
   */
  callback?: () => void

  /**
   * Является ли переход целью
   */
  isGoal?: boolean
}

export type YandexMetrikaSupportedFileExtension =
  | '3gp'
  | '7z'
  | 'aac'
  | 'avi'
  | 'apk'
  | 'csv'
  | 'djvu'
  | 'docx'
  | 'exe'
  | 'flac'
  | 'flv'
  | 'gz'
  | 'key'
  | 'midi'
  | 'mka'
  | 'mkv'
  | 'mp3'
  | 'mp4'
  | 'mpeg'
  | 'mov'
  | 'msi'
  | 'ogg'
  | 'pdf'
  | 'pkg'
  | 'pps'
  | 'ppt'
  | 'pptx'
  | 'rar'
  | 'rtf'
  | 'txt'
  | 'wav'
  | 'wma'
  | 'wmv'
  | 'wmf'
  | 'xlsx'
  | 'zip'

export interface YandexMetricaOptions {
  // Callback-функция, вызываемая после отправки данных о загрузке файла
  callback?: () => void
  // Контекст, доступный в callback-функции по ключевому слову this
  ctx?: Record<string, unknown>
  // Параметры визита
  params?: YandexMetricaPriceParams
  // Заголовок текущей страницы
  title?: string
}

export interface YandexMetricaPriceParams {
  // Доход по цели. Вы можете указать цену как в валюте, так и в условных единицах
  order_price?: number
  // Используйте это поле, если хотите передать цену цели в валюте. Метрика распознает трехбуквенный код валюты по ISO 4217. Если передается другая валюта, будут отправлены нулевые значения вместо валюты и суммы
  currency?: string
}

export interface YandexMetricaFirstPartyParams {
  // Электронный адрес
  email?: string
  // Телефон
  phone_number?: string
  // Имя посетителя
  first_name?: string
  // Фамилия посетителя
  last_name?: string
  // Уникальный идентификатор пользователя Яндекса (id). Передавайте, если на вашем сайте есть авторизация Яндекс ID
  yandex_cid?: string | number
}

export interface YandexMetricaFirstPartyParamsHashed {
  // Электронный адрес определенного формата, хешированный по алгоритму SHA-256.
  // Для проверки хеширования вы можете использовать почту name@yandex.ru. Хеш от нее должен получиться: 41b86f44151924a940be6fa30d93f2471683ca74ac361d3b827a9b72c80a7623.
  // Если адрес электронной почты будет указан в нехешированном виде, Метрика не сможет его распознать.
  email?: string

  // Номер телефона определенного формата, хешированный по алгоритму SHA-256.
  // Для проверки хеширования вы можете использовать телефон 70123456789. Хеш от него должен получиться: 8f0dd3d30a1ea4b739c6217c02604aee1556025da990212759efd877206a1948.
  // Если номер телефона будет указан в нехешированном виде, Метрика не сможет его распознать.
  phone_number?: string
  // Имя посетителя
  first_name?: string
  // Фамилия посетителя
  last_name?: string
  // Уникальный идентификатор пользователя Яндекса (id). Передавайте, если на вашем сайте есть авторизация Яндекс ID
  yandex_cid?: string | number
}

export {}
