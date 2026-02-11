"use client";

import { useState, useEffect } from "react";

const COOLDOWN_MS = 60000;

export function useOtpResendTimer(lastSentAt: number | null) {
  const [, setTick] = useState(0);
  /* eslint-disable react-hooks/purity -- Date.now() for cooldown display is acceptable */
  const canResend = lastSentAt === null || Date.now() - lastSentAt >= COOLDOWN_MS;
  const waitSec =
    lastSentAt && !canResend ? Math.ceil(COOLDOWN_MS / 1000 - (Date.now() - lastSentAt) / 1000) : 0;
  /* eslint-enable react-hooks/purity */

  useEffect(() => {
    if (!canResend && waitSec > 0) {
      const id = setInterval(() => setTick((t) => t + 1), 1000);
      return () => clearInterval(id);
    }
  }, [canResend, waitSec]);

  return { canResend, waitSec };
}
