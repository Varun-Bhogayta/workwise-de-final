import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useNavigate } from "react-router-dom";
import {
  Bell,
  CheckCircle2,
  Clock,
  MoreVertical,
  UserCheck,
  Users,
  X,
  MessageSquare,
} from "lucide-react";

// Mock notification data
const mockNotifications = [
  {
    id: "1",
    type: "application",
    title: "New application received",
    message: "Sarah Johnson applied for UX/UI Designer position",
    time: "2 hours ago",
    read: false,
    actionUrl: "/dashboard/applicants?job=2",
    icon: <UserCheck className="h-5 w-5 text-blue-500" />,
  },
  {
    id: "2",
    type: "message",
    title: "New message",
    message:
      "Michael Brown sent you a message about Senior React Developer position",
    time: "5 hours ago",
    read: false,
    actionUrl: "/dashboard/messages",
    icon: <MessageSquare className="h-5 w-5 text-green-500" />,
  },
  {
    id: "3",
    type: "application",
    title: "Application updated",
    message: "Emily Davis updated her application for Product Manager",
    time: "1 day ago",
    read: true,
    actionUrl: "/dashboard/applicants?job=3",
    icon: <UserCheck className="h-5 w-5 text-blue-500" />,
  },
  {
    id: "4",
    type: "job",
    title: "Job posting expiring soon",
    message: "Your job posting for DevOps Engineer will expire in 2 days",
    time: "2 days ago",
    read: true,
    actionUrl: "/dashboard/manage-jobs",
    icon: <Clock className="h-5 w-5 text-yellow-500" />,
  },
  {
    id: "5",
    type: "system",
    title: "Profile view",
    message: "Your company profile was viewed 15 times in the last week",
    time: "3 days ago",
    read: true,
    actionUrl: "/dashboard/analytics",
    icon: <Users className="h-5 w-5 text-purple-500" />,
  },
];

export default function NotificationsPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("all");
  const [notifications, setNotifications] = useState(mockNotifications);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const filteredNotifications = notifications.filter((notification) => {
    if (activeTab === "all") return true;
    if (activeTab === "unread") return !notification.read;
    return notification.type === activeTab;
  });

  const markAsRead = (id: string) => {
    setNotifications(
      notifications.map((notification) =>
        notification.id === id ? { ...notification, read: true } : notification
      )
    );
  };

  const markAllAsRead = () => {
    setNotifications(
      notifications.map((notification) => ({ ...notification, read: true }))
    );
  };

  const deleteNotification = (id: string) => {
    setNotifications(
      notifications.filter((notification) => notification.id !== id)
    );
  };

  const clearAllNotifications = () => {
    setNotifications([]);
  };

  const handleNotificationClick = (
    notification: (typeof mockNotifications)[0]
  ) => {
    markAsRead(notification.id);
    navigate(notification.actionUrl);
  };

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Notifications</h1>

        <div className="flex gap-2">
          {unreadCount > 0 && (
            <Button variant="outline" onClick={markAllAsRead}>
              Mark all as read
            </Button>
          )}
          {notifications.length > 0 && (
            <Button variant="destructive" onClick={clearAllNotifications}>
              Clear all
            </Button>
          )}
        </div>
      </div>

      <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
        <div className="flex justify-between items-center mb-6">
          <TabsList>
            <TabsTrigger value="all" className="flex items-center gap-2">
              All
              {notifications.length > 0 && (
                <Badge variant="secondary">{notifications.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="unread" className="flex items-center gap-2">
              Unread
              {unreadCount > 0 && (
                <Badge variant="secondary">{unreadCount}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="application">Applications</TabsTrigger>
            <TabsTrigger value="message">Messages</TabsTrigger>
            <TabsTrigger value="job">Jobs</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value={activeTab} className="mt-0">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>
                {activeTab === "all" && "All Notifications"}
                {activeTab === "unread" && "Unread Notifications"}
                {activeTab === "application" && "Application Notifications"}
                {activeTab === "message" && "Message Notifications"}
                {activeTab === "job" && "Job Notifications"}
              </CardTitle>
              <CardDescription>
                {activeTab === "all"
                  ? "All your recent notifications"
                  : activeTab === "unread"
                  ? "Notifications you haven't read yet"
                  : `Recent notifications related to ${activeTab}s`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {filteredNotifications.length > 0 ? (
                <div className="divide-y">
                  {filteredNotifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`flex items-start gap-4 py-4 px-2 hover:bg-accent/50 rounded-md transition-colors ${
                        !notification.read ? "bg-accent/30" : ""
                      }`}
                    >
                      <div className="flex-shrink-0 mt-1">
                        {notification.icon}
                      </div>
                      <div
                        className="flex-1 cursor-pointer"
                        onClick={() => handleNotificationClick(notification)}
                      >
                        <div className="flex justify-between">
                          <h4 className="font-medium">
                            {notification.title}
                            {!notification.read && (
                              <Badge
                                variant="default"
                                className="ml-2 px-1 py-0"
                              >
                                New
                              </Badge>
                            )}
                          </h4>
                          <span className="text-xs text-muted-foreground">
                            {notification.time}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {notification.message}
                        </p>
                      </div>
                      <div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="h-4 w-4" />
                              <span className="sr-only">Options</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {!notification.read ? (
                              <DropdownMenuItem
                                onClick={() => markAsRead(notification.id)}
                              >
                                <CheckCircle2 className="mr-2 h-4 w-4" />
                                Mark as read
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem
                                onClick={() =>
                                  setNotifications(
                                    notifications.map((n) =>
                                      n.id === notification.id
                                        ? { ...n, read: false }
                                        : n
                                    )
                                  )
                                }
                              >
                                <Bell className="mr-2 h-4 w-4" />
                                Mark as unread
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem
                              onClick={() =>
                                deleteNotification(notification.id)
                              }
                            >
                              <X className="mr-2 h-4 w-4" />
                              Remove
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center">
                  <Bell className="mx-auto h-12 w-12 text-muted-foreground/50" />
                  <h3 className="mt-4 text-lg font-medium">No notifications</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {activeTab === "all"
                      ? "You don't have any notifications"
                      : `You don't have any ${
                          activeTab === "unread" ? "unread" : activeTab
                        } notifications`}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
