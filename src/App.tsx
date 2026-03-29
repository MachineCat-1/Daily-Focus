import { useEffect } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { CheckInPage } from "@/pages/CheckInPage";
import { FocusPage } from "@/pages/FocusPage";
import { InboxPage } from "@/pages/InboxPage";
import { TaskDetailPage } from "@/pages/TaskDetailPage";
import { TodayPage } from "@/pages/TodayPage";
import { useAppStore } from "@/store/useAppStore";

export default function App() {
  const runDayRollover = useAppStore((s) => s.runDayRollover);
  const migrateLegacyCheckInIfNeeded = useAppStore(
    (s) => s.migrateLegacyCheckInIfNeeded,
  );

  useEffect(() => {
    runDayRollover();
  }, [runDayRollover]);

  useEffect(() => {
    migrateLegacyCheckInIfNeeded();
  }, [migrateLegacyCheckInIfNeeded]);

  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Navigate to="/today" replace />} />
          <Route path="/inbox" element={<InboxPage />} />
          <Route path="/today" element={<TodayPage />} />
          <Route path="/focus" element={<FocusPage />} />
          <Route path="/checkin" element={<CheckInPage />} />
          <Route path="/task/:id" element={<TaskDetailPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
