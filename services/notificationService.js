// src/services/notificationService.js
import * as Notifications from "expo-notifications";

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

  // Cancel any existing notifications for safety before scheduling
  const identifier = await Notifications.scheduleNotificationAsync({
    content: {
      title: "💊 Medication Reminder",
      body: `Reminder: It's time to take your medication - ${medicationName}`,
      sound: true,
      priority: Notifications.AndroidNotificationPriority.HIGH,
      // Android notification channel (required for Android 8+)
      categoryIdentifier: "medication",
    },
    trigger: {
      // Fires every day at the specified hour/minute
      type: Notifications.SchedulableTriggerInputTypes.DAILY, // ✅ السطر الجديد

      hour: hours,
      minute: minutes,
      repeats: true,
    },
  });

  console.log(
    `📅 Notification scheduled: ${identifier} at ${timeString} for "${medicationName}"`,
  );
  return identifier;
};

/**
 * Cancel a previously scheduled notification.
 *
 * @param {string} notificationId - identifier returned by scheduleMedicationReminder
 */
export const cancelMedicationReminder = async (notificationId) => {
  if (!notificationId) return;
  await Notifications.cancelScheduledNotificationAsync(notificationId);
  console.log(`🗑️ Notification cancelled: ${notificationId}`);
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
