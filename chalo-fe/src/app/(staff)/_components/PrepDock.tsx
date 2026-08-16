// Vùng phải cố định của layout staff. Giữ adapter này mỏng để dock desktop
// tiếp tục có cùng contract/kích thước, còn logic nằm trong PrepWorkspace.
import { PrepWorkspace } from "./PrepWorkspace";

export const PrepDock = ({ enabled }: { enabled: boolean }) => (
  <PrepWorkspace enabled={enabled} />
);
