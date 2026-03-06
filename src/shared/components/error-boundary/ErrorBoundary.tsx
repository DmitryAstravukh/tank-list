import { Component } from "react";
import "./ErrorBoundary.scss";

type Props = {
  children: React.ReactNode;
  onReset?: () => void;
  title?: string;
};

type State = { error: unknown | null };

/**
 * ErrorBoundary (React) — перехватывает ошибки, возникшие в дочерних компонентах во время рендера,
 * в методах жизненного цикла и в конструкторах, и показывает fallback UI вместо children.
 *
 * Что умеет:
 * - При ошибке отображает экран с сообщением, картинкой и кнопкой "Починить".
 * - Логирует ошибку в console.error (сюда обычно подключают Sentry/LogRocket и т.п.).
 * - По кнопке "Починить" сбрасывает ошибку и вызывает onReset (если передан).
 *
 * Ограничения ErrorBoundary (важно помнить):
 * - Не ловит ошибки в обработчиках событий (onClick и т.п.), в async-коде (setTimeout/Promise),
 *   а также ошибки в самом ErrorBoundary.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  /**
   * Обновляет state, когда React поймал ошибку в дочернем дереве.
   * Это переводит компонент в режим fallback UI.
   *
   * @param error Любая пойманная ошибка (тип unknown).
   * @returns Новое состояние с сохраненной ошибкой.
   */
  static getDerivedStateFromError(error: unknown): State {
    return { error };
  }

  /**
   * Вызывается после того, как ошибка поймана (после getDerivedStateFromError).
   * Здесь обычно делают сайд-эффекты: логирование, отправку ошибки в мониторинг и т.п.
   *
   * @param error Пойманная ошибка.
   * @param info Доп. данные от React (например component stack).
   */
  componentDidCatch(error: unknown, info: unknown) {
    // сюда можно подключить Sentry и т.п.

    console.error("ErrorBoundary caught error:", error, info);
  }

  /**
   * Сбрасывает ошибку и возвращает рендер children.
   * Дополнительно вызывает onReset, если он передан.
   */
  private reset = () => {
    this.setState({ error: null });
    this.props.onReset?.();
  };

  render() {
    if (this.state.error) {
      return (
        <div className="error">
          <h1>Зачем сломал?</h1>
          <img className="error__img" src="/dog.jpg" alt="Собака осудительно смотрит" />
          <button className="error__button" onClick={this.reset}>
            Починить
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
