import { Route, Routes } from "react-router-dom";
import { TankListPage } from "./pages/tank-list-page/TankListPage";
import { Loader } from "./shared/components/loader/Loader";
import { QueryErrorResetBoundary } from "@tanstack/react-query";
import { ErrorBoundary } from "./shared/components/error-boundary/ErrorBoundary";

const App = () => {
  return (
    <QueryErrorResetBoundary>
      {({ reset }) => (
        <ErrorBoundary title="Ошибка приложения" onReset={reset}>
          <Loader />

          <Routes>
            <Route path="/" element={<TankListPage />} />
          </Routes>
        </ErrorBoundary>
      )}
    </QueryErrorResetBoundary>
  );
};

export default App;
