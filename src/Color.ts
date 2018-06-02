export class Color {
    private static cache = new Map<string, Color>();

    private constructor(
        public readonly red: number,
        public readonly green: number,
        public readonly blue: number,
    ) {}

    public toHexString(): string {
        return `${Color.toHexString(this.red)}${Color.toHexString(
            this.green,
        )}${Color.toHexString(this.blue)}`;
    }

    private static toHexString(n: number): string {
        return ("0" + n.toString(16)).slice(-2);
    }

    public static getColor(red: number, green: number, blue: number): Color {
        const possibleDuplicate = new Color(red, green, blue);
        const key = possibleDuplicate.toHexString();
        if (Color.cache.has(key)) {
            return Color.cache.get(key)!;
        }
        Color.cache.set(key, possibleDuplicate);
        return possibleDuplicate;
    }
}
