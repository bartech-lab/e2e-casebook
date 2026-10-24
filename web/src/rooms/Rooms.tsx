const ROOMS = [
  { id: 'garden', name: 'Garden room', alt: 'Double bed by a window onto the garden', text: 'Quiet, on the ground floor, with its own door to the garden.' },
  { id: 'attic', name: 'Attic room', alt: 'Two single beds under a sloping wooden ceiling', text: 'Under the roof, with two single beds and a skylight.' },
  { id: 'harbour', name: 'Harbour room', alt: 'Armchair by a balcony door with the harbour beyond', text: 'A small balcony over the harbour. Best at sunset.' },
];

const photo = (id: string, width: number) => `/api/room-photos/${id}-${width}.png`;

export function Rooms() {
  return (
    <section>
      <h1>Rooms</h1>
      <img className="rooms-wave" src={photo('wave', 400)} srcSet={`${photo('wave', 400)} 400w, ${photo('wave', 800)} 800w`} sizes="400px" width={400} height={50} alt="" />
      {ROOMS.map((room) => (
        <article key={room.id} className="room">
          <img
            className="room-photo"
            src={photo(room.id, 400)}
            srcSet={`${photo(room.id, 400)} 400w, ${photo(room.id, 800)} 800w, ${photo(room.id, 1600)} 1600w`}
            sizes="(max-width: 490px) calc(100vw - 90px), 400px"
            width={400}
            height={300}
            alt={room.alt}
          />
          <h2>{room.name}</h2>
          <p>{room.text}</p>
        </article>
      ))}
    </section>
  );
}
