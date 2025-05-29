export interface Label {
  name: string;
  description?: string;
}

export interface YamlData {
  messages: {
    role: "system" | "user";
    content: string;
  }[];
}
