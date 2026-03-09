// src/services/notificationService.js
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

/**
 * Schedule a daily repeating local notification at the given time.
 *
 * @param {string} medicationName  - shown in the notification body
 * @param {string} timeString      - "HH:MM" in 24-hour format
 * @returns {string}               - notification identifier (store in DB for cancellation)
 */
export const scheduleMedicationReminder = async (
  medicationName,
  timeString,
) => {
  const [hours, minutes] = timeString.split(":").map(Number);

  const notificationContent = {
    title: "💊 Medication Reminder",
    body: `Time to take your medication: ${medicationName}`,
    sound: true,
    priority: Notifications.AndroidNotificationPriority.HIGH,
  };

  // On Android, add channelId to content (required for Android 8+)
  if (Platform.OS === "android") {
    notificationContent.channelId = "medication";
  }

  try {
    // Try scheduling a true daily (exact) repeating notification
    const identifier = await Notifications.scheduleNotificationAsync({
      content: notificationContent,
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: hours,
        minute: minutes,
        channelId: "medication", // Android 8+ channel
      },
    });

    console.log(
      `📅 Daily notification scheduled: ${identifier} at ${timeString} for "${medicationName}"`,
    );
    return identifier;
  } catch (dailyError) {
    // Fallback: some Android devices with restricted permissions can't schedule
    // exact daily alarms. Fall back to a one-time notification 24h from now
    // as a graceful degradation so the save still succeeds.
    console.warn(
      "DAILY trigger failed, falling back to TIME_INTERVAL:",
      dailyError,
    );

    // Calculate seconds until the next occurrence of the given time
    const now = new Date();
    const target = new Date();
    target.setHours(hours, minutes, 0, 0);
    if (target <= now) {
      // If time already passed today, schedule for tomorrow
      target.setDate(target.getDate() + 1);
    }
    const secondsUntilTarget = Math.max(
      10,
      Math.floor((target.getTime() - now.getTime()) / 1000),
    );

    const identifier = await Notifications.scheduleNotificationAsync({
      content: notificationContent,
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: secondsUntilTarget,
        channelId: "medication",
      },
    });

    console.log(
      `📅 Fallback notification scheduled: ${identifier} in ${secondsUntilTarget}s for "${medicationName}"`,
    );
    return identifier;
  }
};

/**
 * Cancel a previously scheduled notification.
 *
 * @param {string} notificationId - identifier returned by scheduleMedicationReminder
 */
export const cancelMedicationReminder = async (notificationId) => {
  if (!notificationId) return;
  try {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
    console.log(`🗑️ Notification cancelled: ${notificationId}`);
  } catch (error) {
    console.warn("Could not cancel notification:", error);
  }
};

/**
 * Cancel ALL scheduled notifications (use with caution).
 */
export const cancelAllReminders = async () => {
  await Notifications.cancelAllScheduledNotificationsAsync();
};

/**
 * Returns a list of all pending (scheduled) notifications.
 * Useful for debugging.
 */
export const getPendingNotifications = async () => {
  return await Notifications.getAllScheduledNotificationsAsync();
};
