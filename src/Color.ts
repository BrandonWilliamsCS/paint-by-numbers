export class Color {
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
        //!! no dups
        return new Color(red, green, blue);
    }
}
