"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  User,
  Bell,
  Clock,
  Settings2,
  Loader2,
  Check,
  AlertCircle,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface UserProfile {
  full_name: string | null;
  email: string | null;
  avatar_url: string | null;
}

interface UserSettings {
  email_notifications: boolean;
  email_weekly_summary: boolean;
  email_session_reminders: boolean;
  email_product_updates: boolean;
  reminder_enabled: boolean;
  reminder_time: string;
  reminder_days: string[];
  default_difficulty: string;
  default_duration: number;
  timezone: string;
}

const DAYS_OF_WEEK = [
  { value: "mon", label: "Mon" },
  { value: "tue", label: "Tue" },
  { value: "wed", label: "Wed" },
  { value: "thu", label: "Thu" },
  { value: "fri", label: "Fri" },
  { value: "sat", label: "Sat" },
  { value: "sun", label: "Sun" },
];

const TIMEZONES = [
  { value: "America/New_York", label: "Eastern Time (ET)" },
  { value: "America/Chicago", label: "Central Time (CT)" },
  { value: "America/Denver", label: "Mountain Time (MT)" },
  { value: "America/Los_Angeles", label: "Pacific Time (PT)" },
  { value: "America/Phoenix", label: "Arizona (MST)" },
  { value: "Pacific/Honolulu", label: "Hawaii (HST)" },
];

export default function SettingsPage() {
  const [profile, setProfile] = useState<UserProfile>({
    full_name: "",
    email: "",
    avatar_url: null,
  });
  const [settings, setSettings] = useState<UserSettings>({
    email_notifications: true,
    email_weekly_summary: true,
    email_session_reminders: true,
    email_product_updates: false,
    reminder_enabled: true,
    reminder_time: "09:00",
    reminder_days: ["mon", "tue", "wed", "thu", "fri"],
    default_difficulty: "beginner",
    default_duration: 30,
    timezone: "America/Los_Angeles",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "success" | "error">("idle");

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    // Load profile
    const { data: profileData } = await supabase
      .from("profiles")
      .select("full_name, email, avatar_url")
      .eq("id", user.id)
      .single();

    if (profileData) {
      setProfile(profileData);
    }

    // Load settings
    const { data: settingsData } = await supabase
      .from("user_settings")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (settingsData) {
      setSettings({
        email_notifications: settingsData.email_notifications,
        email_weekly_summary: settingsData.email_weekly_summary,
        email_session_reminders: settingsData.email_session_reminders,
        email_product_updates: settingsData.email_product_updates,
        reminder_enabled: settingsData.reminder_enabled,
        reminder_time: settingsData.reminder_time,
        reminder_days: settingsData.reminder_days,
        default_difficulty: settingsData.default_difficulty,
        default_duration: settingsData.default_duration,
        timezone: settingsData.timezone,
      });
    }

    setLoading(false);
  }

  async function handleSave() {
    setSaving(true);
    setSaveStatus("idle");

    try {
      const response = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profile, settings }),
      });

      if (!response.ok) {
        throw new Error("Failed to save settings");
      }

      setSaveStatus("success");
      setTimeout(() => setSaveStatus("idle"), 3000);
    } catch (error) {
      console.error("Save error:", error);
      setSaveStatus("error");
    } finally {
      setSaving(false);
    }
  }

  function toggleReminderDay(day: string) {
    setSettings((prev) => ({
      ...prev,
      reminder_days: prev.reminder_days.includes(day)
        ? prev.reminder_days.filter((d) => d !== day)
        : [...prev.reminder_days, day],
    }));
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground">
            Manage your account and preferences
          </p>
        </div>
        <Button
          onClick={handleSave}
          disabled={saving}
          className="bg-primary text-primary-foreground hover:bg-primary/90"
        >
          {saving ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : saveStatus === "success" ? (
            <Check className="mr-2 h-4 w-4" />
          ) : saveStatus === "error" ? (
            <AlertCircle className="mr-2 h-4 w-4" />
          ) : null}
          {saving ? "Saving..." : saveStatus === "success" ? "Saved!" : "Save Changes"}
        </Button>
      </div>

      {/* Profile Section */}
      <Card className="border-primary/20 bg-muted/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5 text-primary" />
            Profile
          </CardTitle>
          <CardDescription>
            Your personal information
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name</Label>
              <Input
                id="fullName"
                value={profile.full_name || ""}
                onChange={(e) =>
                  setProfile((prev) => ({ ...prev, full_name: e.target.value }))
                }
                placeholder="John Smith"
                className="border-primary/30 bg-muted/50"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={profile.email || ""}
                disabled
                className="border-primary/30 bg-muted/50 opacity-50"
              />
              <p className="text-xs text-muted-foreground">
                Contact support to change your email
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notification Settings */}
      <Card className="border-primary/20 bg-muted/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-primary" />
            Notifications
          </CardTitle>
          <CardDescription>
            Choose what emails you receive
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Email Notifications</Label>
              <p className="text-sm text-muted-foreground">
                Receive emails about your account activity
              </p>
            </div>
            <Switch
              checked={settings.email_notifications}
              onCheckedChange={(checked) =>
                setSettings((prev) => ({ ...prev, email_notifications: checked }))
              }
            />
          </div>

          <Separator className="bg-primary/20" />

          <div className="space-y-4 pl-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Weekly Summary</Label>
                <p className="text-sm text-muted-foreground">
                  Get a weekly report of your progress
                </p>
              </div>
              <Switch
                checked={settings.email_weekly_summary}
                onCheckedChange={(checked) =>
                  setSettings((prev) => ({ ...prev, email_weekly_summary: checked }))
                }
                disabled={!settings.email_notifications}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Session Reminders</Label>
                <p className="text-sm text-muted-foreground">
                  Reminders to keep your streak going
                </p>
              </div>
              <Switch
                checked={settings.email_session_reminders}
                onCheckedChange={(checked) =>
                  setSettings((prev) => ({ ...prev, email_session_reminders: checked }))
                }
                disabled={!settings.email_notifications}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Product Updates</Label>
                <p className="text-sm text-muted-foreground">
                  News about new features and improvements
                </p>
              </div>
              <Switch
                checked={settings.email_product_updates}
                onCheckedChange={(checked) =>
                  setSettings((prev) => ({ ...prev, email_product_updates: checked }))
                }
                disabled={!settings.email_notifications}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Practice Reminders */}
      <Card className="border-primary/20 bg-muted/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            Practice Reminders
          </CardTitle>
          <CardDescription>
            Set up daily reminders to practice
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Enable Reminders</Label>
              <p className="text-sm text-muted-foreground">
                Get reminded to practice at your preferred time
              </p>
            </div>
            <Switch
              checked={settings.reminder_enabled}
              onCheckedChange={(checked) =>
                setSettings((prev) => ({ ...prev, reminder_enabled: checked }))
              }
            />
          </div>

          {settings.reminder_enabled && (
            <>
              <Separator className="bg-primary/20" />

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Reminder Time</Label>
                  <Input
                    type="time"
                    value={settings.reminder_time}
                    onChange={(e) =>
                      setSettings((prev) => ({ ...prev, reminder_time: e.target.value }))
                    }
                    className="w-32 border-primary/30 bg-muted/50"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Reminder Days</Label>
                  <div className="flex flex-wrap gap-2">
                    {DAYS_OF_WEEK.map((day) => (
                      <Button
                        key={day.value}
                        type="button"
                        variant={settings.reminder_days.includes(day.value) ? "default" : "outline"}
                        size="sm"
                        onClick={() => toggleReminderDay(day.value)}
                        className={
                          settings.reminder_days.includes(day.value)
                            ? "bg-primary text-primary-foreground hover:bg-primary/90"
                            : "border-gold-500/30 hover:bg-primary/10"
                        }
                      >
                        {day.label}
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Timezone</Label>
                  <Select
                    value={settings.timezone}
                    onValueChange={(value) =>
                      setSettings((prev) => ({ ...prev, timezone: value }))
                    }
                  >
                    <SelectTrigger className="w-64 border-primary/30 bg-muted/50">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TIMEZONES.map((tz) => (
                        <SelectItem key={tz.value} value={tz.value}>
                          {tz.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Default Session Settings */}
      <Card className="border-primary/20 bg-muted/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings2 className="h-5 w-5 text-primary" />
            Default Session Settings
          </CardTitle>
          <CardDescription>
            Customize your default roleplay settings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Default Difficulty</Label>
              <Select
                value={settings.default_difficulty}
                onValueChange={(value) =>
                  setSettings((prev) => ({ ...prev, default_difficulty: value }))
                }
              >
                <SelectTrigger className="border-primary/30 bg-muted/50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="beginner">Beginner</SelectItem>
                  <SelectItem value="intermediate">Intermediate</SelectItem>
                  <SelectItem value="advanced">Advanced</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                The difficulty level selected by default when starting a session
              </p>
            </div>

            <div className="space-y-2">
              <Label>Default Duration</Label>
              <Select
                value={settings.default_duration.toString()}
                onValueChange={(value) =>
                  setSettings((prev) => ({ ...prev, default_duration: parseInt(value) }))
                }
              >
                <SelectTrigger className="border-primary/30 bg-muted/50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10 minutes</SelectItem>
                  <SelectItem value="30">30 minutes</SelectItem>
                  <SelectItem value="60">60 minutes</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                The session duration selected by default
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-red-500/20 bg-muted/50">
        <CardHeader>
          <CardTitle className="text-red-500">Danger Zone</CardTitle>
          <CardDescription>
            Irreversible actions for your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <p className="font-medium">Delete Account</p>
              <p className="text-sm text-muted-foreground">
                Permanently delete your account and all data
              </p>
            </div>
            <Button
              variant="outline"
              className="border-red-500/50 text-red-500 hover:bg-red-500/10"
            >
              Delete Account
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
