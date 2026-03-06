import { useNavigate } from "react-router-dom";
import "./NotFound.scss";
import { useEffect } from "react";

/**
 * NotFound — страница 404.
 *
 * Показывает пользователю сообщение о том, что страница не найдена,
 * и предлагает вернуться на главную.
 *
 * Поведение:
 * - Устанавливает заголовок страницы 404 — Страница не найдена. Возвращает после размонтирования.
 * - По клику на кнопку "На главную" выполняет navigate("/") (react-router).
 *
 * @returns React-элемент страницы "Не найдено".
 */
export const NotFound = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const previousTitle = document.title;
    document.title = "404 — Страница не найдена";

    return () => {
      document.title = previousTitle;
    };
  }, []);

  const handleNavigate = () => navigate("/");

  return (
    <div className="not-found">
      <h1>Любопытный?</h1>
      <img className="not-found__img" src="/dog.jpg" alt="Собака осудительно смотрит" />
      <button className="not-found__button" onClick={handleNavigate}>
        На главную
      </button>
    </div>
  );
};
