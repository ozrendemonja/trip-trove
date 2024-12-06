export interface CurrentUserInfoProps {
    /**
     * Primary text to display, usually the name of the person.
     */
    text?: string;
    /**
     * Url to the image to use, should be a square aspect ratio and big enough to fit in the image area.
     */
    imageUrl?: string;
    /**
     * Alt text for the image to use.
     * @default `''` (empty string)
     */
    imageAlt?: string;
    /**
     * The user's initials to display in the image area when there is no image.
     * @defaultvalue Derived from `text`
     */
    imageInitials?: string;
    /**
     * Secondary text to display, usually the role of the user.
     */
    secondaryText?: string;
    /**
     * Optional custom persona coin size in pixel.
     * @default 26
     */
    coinSize?: number;
    /**
     * The background color when the user's initials are displayed.
     * @defaultvalue Derived from `text`
     */
    initialsColor?: string;
    /**
     * The text color when the user's initials are displayed
     */
    initialsTextColor?: string;
}
