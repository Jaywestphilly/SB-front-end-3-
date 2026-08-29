import React, { useEffect } from "react";

export const VacancyEmpireGame: React.FC = () => {
  useEffect(() => {
    // We scroll to top when mounting this game page
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="w-full flex-grow flex flex-col items-stretch overflow-hidden border border-cyan-500/20 bg-black/50 shadow-[0_0_30px_rgba(6,182,212,0.1)] rounded-2xl md:min-h-[85vh] min-h-[90vh]">
      <iframe
        src="/vacancy-empire.html"
        className="w-full h-full flex-grow border-0 rounded-2xl"
        title="Vacancy Empire | Stock Bloc Real Estate"
        style={{ minHeight: "85vh" }}
      />
    </div>
  );
};
