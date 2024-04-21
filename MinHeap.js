class MinHeap {
    constructor(valueFunction) {
        this.content = [];
        this.value = valueFunction; // Do comparisons with this.value(element) not just element
    }

    size() {
        return this.content.length;
    }

    push(element) {
        this.content.push(element);
        this.heapifyUp(this.content.length - 1);
    }

    pop() {
        const result = this.content[0];
        const end = this.content.pop();
        if (this.content.length > 0) {
            this.content[0] = end;
            this.heapifyDown(0);
        }
        return result;
    }

    heapifyUp(n) {
        const element = this.content[n];
        const score = this.value(element);
        while (n > 0) {
            const parentN = Math.floor((n + 1) / 2) - 1;
            const parent = this.content[parentN];
            if (score >= this.value(parent))
                break;
            this.content[parentN] = element;
            this.content[n] = parent;
            n = parentN;
        }
    }

    heapifyDown(n) {
        const length = this.content.length;
        const element = this.content[n];
        const elemScore = this.value(element);

        while (true) {
            const val2 = (n + 1) * 2;
            const index1 = val2 - 1;

            let swap = null;
            let val1;
            // If the first child exists (is inside the array)...
            if (index1 < length) {
                const child1 = this.content[index1];
                val1 = this.value(child1);
                if (val1 < elemScore)
                    swap = index1;
            }
            // Do the same checks for the other child.
            if (val2 < length) {
                const child2 = this.content[val2];
                const child2Score = this.value(child2);
                if (child2Score < (swap === null ? elemScore : val1))
                    swap = val2;
            }

            if (swap === null) break;
            this.content[n] = this.content[swap];
            this.content[swap] = element;
            n = swap;
        }
    }
}
