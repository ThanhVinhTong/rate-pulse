export interface ActionState {
  status: "idle" | "success" | "error";
  message: string;
}

export const initialActionState: ActionState = {
  status: "idle",
  message: "",
};
