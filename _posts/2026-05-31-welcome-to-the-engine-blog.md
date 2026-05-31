---
layout: post
title: "Building an ECS in C++"
tags: [cpp, ecs, architecture]
categories: engine
---

Today we implement a simple Entity Component System...

```cpp
int main() {
    return 0;
}
```

---
layout: default
title: Tags
---

<h1>Tags</h1>

{% assign tags = site.tags %}

{% for tag in tags %}
  <h3>{{ tag[0] }}</h3>

  <ul>
    {% for post in tag[1] %}
      <li><a href="{{ post.url }}">{{ post.title }}</a></li>
    {% endfor %}
  </ul>
{% endfor %}