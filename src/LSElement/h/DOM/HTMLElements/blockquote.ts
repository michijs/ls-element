import { GetAttributes } from "../DOMAttributes/Utils";
import { GlobalAttributes } from "../DOMAttributes/GlobalAttributes";
import { GetRoles } from "../DOMAttributes/Utils";

export type blockquote = Partial<
    GlobalAttributes
    & GetAttributes<'cite'>
    & GetRoles
>